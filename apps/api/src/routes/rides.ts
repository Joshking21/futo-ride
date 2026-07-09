import type { FastifyInstance } from "fastify";
import { FieldValue } from "firebase-admin/firestore";
import { verifyRequest } from "../lib/auth.js";
import { adminDb } from "../lib/firestore.js";
import { ok, HttpError } from "../lib/http.js";
import { CAMPUS_STOPS } from "../lib/campus-stops.js";
import { seatFareKobo, driverSeatShareKobo, platformCutKobo } from "../lib/fare.js";
import { evaluateSurge, driverPriorityBonusKobo } from "../lib/surge.js";
import { mintQrToken, mintCompletionPin, verifyQrToken } from "../lib/qr.js";
import {
  PAYMENT_WINDOW_MS,
  DRIVER_HEARTBEAT_MS,
  PLATFORM_FEE_BPS,
  CANCELLATION_FEE_KOBO,
} from "../lib/config.js";
import {
  onlineKekes,
  matchKeke,
  freeSeats,
  sweepExpiredRides,
  sweepStaleDriverRides,
  rematchRide,
  DEFAULT_CAPACITY,
  type Stop,
} from "../lib/matching.js";
import { dispatchToDriver, pingDriver } from "../lib/dispatch.js";
import { raiseIncident } from "../lib/incidents.js";
import { BookRide, CompleteRide, RateRide, RideId, UpdateRideStatus } from "../schemas/rides.js";
import type { Ride, RideStatus } from "../types/index.js";

const ACTIVE_STATUSES: RideStatus[] = ["assigned", "arriving", "started"];
const RATE_LIMIT = { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } };

function stopById(id: string): Stop | undefined {
  return CAMPUS_STOPS.find((s) => s.id === id);
}

/** True if the ride still needs a confirmed payment before it can advance/complete (§20.2). */
function needsPayment(ride: Ride): boolean {
  return ride.paymentStatus !== "PAID";
}

/**
 * Credits a driver's earnings ledger (§20.2): writes one deterministic `earnings`
 * doc keyed to the reason so a retry can't double-credit (M7), and bumps the running
 * `earningsKobo` total. `key` distinguishes fare vs. cancellation-fee credits per ride.
 */
async function creditDriver(driverId: string, rideId: string, amountKobo: number, key: string): Promise<void> {
  if (!driverId || amountKobo <= 0) return;
  const db = adminDb();
  const earningRef = db.collection("earnings").doc(`${rideId}_${key}`);
  const created = await db.runTransaction(async (tx) => {
    if ((await tx.get(earningRef)).exists) return false; // already credited
    tx.set(earningRef, { id: earningRef.id, driverId, rideId, amount: amountKobo, createdAt: Date.now() });
    return true;
  });
  if (created) {
    await db
      .collection("drivers")
      .doc(driverId)
      .set({ earningsKobo: FieldValue.increment(amountKobo) }, { merge: true });
  }
}

export default async function rideRoutes(app: FastifyInstance) {
  app.post("/rides", RATE_LIMIT, async (req) => {
    const user = await verifyRequest(req);
    const body = BookRide.parse(req.body);

    const from = stopById(body.fromStop);
    const to = stopById(body.toStop);
    if (!from || !to) throw new HttpError("Unknown stop", 400);

    const db = adminDb();

    // Free lapsed unpaid holds (§20.1) and rescue paid riders whose driver vanished
    // (§21/H5) first, so their seats are available to match and they aren't left stuck.
    await Promise.all([
      sweepExpiredRides().catch((err) => req.log.error({ err }, "expiry sweep failed")),
      sweepStaleDriverRides().catch((err) => req.log.error({ err }, "stale-driver sweep failed")),
    ]);

    // One active ride per rider (§20.10): block a second in-progress ride.
    const active = await db
      .collection("rides")
      .where("riderId", "==", user.uid)
      .where("status", "in", ACTIVE_STATUSES)
      .limit(1)
      .get();
    if (!active.empty) throw new HttpError("You already have an active ride", 409);

    // Reuse an existing stranded ("requested") ride so retries don't pile up docs or
    // inflate the surge pending-count (§20.10). But NEVER reuse a doc that is paid or
    // owed a refund — overwriting it would destroy the payment/refund trail (C2, §21);
    // leave those for the deferred refund and open a fresh doc.
    const strandedSnap = await db
      .collection("rides")
      .where("riderId", "==", user.uid)
      .where("status", "==", "requested")
      .limit(5)
      .get();
    const reusable = strandedSnap.docs.find((d) => {
      const r = d.data() as Ride;
      return r.paymentStatus !== "PAID" && r.refundPending !== true;
    });
    const reuseRef = reusable?.ref ?? null;

    const [kekes, surge] = await Promise.all([onlineKekes(), evaluateSurge(body.fromStop)]);
    const match = matchKeke(from, body.toStop, body.seats, kekes);
    const priorityFee = surge.honorPriority ? (body.priorityFee ?? 0) : 0;
    const fare = seatFareKobo(body.seats) + priorityFee;
    const now = Date.now();

    if (!match) {
      // Stranded: record/refresh the request and (once) raise a HIGH incident.
      const ref = reuseRef ?? db.collection("rides").doc();
      const ride: Ride = {
        id: ref.id,
        riderId: user.uid,
        driverId: "",
        fromStop: body.fromStop,
        toStop: body.toStop,
        status: "requested",
        fare,
        priorityFee,
        payMethod: body.payMethod,
        qrToken: "",
        completionPin: "",
        createdAt: now,
        seats: body.seats,
      };
      await ref.set(ride);

      if (!reuseRef) {
        await raiseIncident({
          riderId: user.uid,
          type: "stranded",
          message: `No keke seat available for a rider requesting ${from.name} → ${to.name} (${body.seats} seat(s)).`,
          location: `${from.name} (${from.lat},${from.lng})`,
          rideId: ref.id,
        }).catch((err) => req.log.error({ err }, "stranded-student alert failed"));
      }

      return ok({
        rideId: ref.id,
        driverId: null,
        fare,
        seats: body.seats,
        pooled: false,
        stranded: true,
      });
    }

    // Claim seats atomically; re-check the keke is still online, fresh, and roomy
    // inside the transaction so a race can't overfill or assign a keke that just left.
    const rideRef = reuseRef ?? db.collection("rides").doc();
    const driverRef = db.collection("drivers").doc(match.id);
    let seatsTakenAfter = body.seats;
    await db.runTransaction(async (tx) => {
      const dSnap = await tx.get(driverRef);
      const d = dSnap.data() ?? {};
      const lastSeenAt = typeof d.lastSeenAt === "number" ? d.lastSeenAt : 0;
      if (d.online !== true || lastSeenAt < Date.now() - DRIVER_HEARTBEAT_MS) {
        throw new HttpError("Keke just went offline, try again", 409);
      }
      const capacity = typeof d.capacity === "number" ? d.capacity : DEFAULT_CAPACITY;
      const seatsTaken = typeof d.seatsTaken === "number" ? d.seatsTaken : 0;
      // A keke with an active pool must be on the SAME lane (from + to) and not started.
      const sameLane = d.poolFromStop === body.fromStop && d.poolToStop === body.toStop;
      if (seatsTaken > 0 && (d.poolStarted === true || !sameLane)) {
        throw new HttpError("Keke just filled up, try again", 409);
      }
      if (capacity - seatsTaken < body.seats) {
        throw new HttpError("Keke just filled up, try again", 409);
      }
      seatsTakenAfter = seatsTaken + body.seats;
      tx.update(driverRef, {
        seatsTaken: seatsTakenAfter,
        poolFromStop: body.fromStop,
        poolToStop: body.toStop,
      });

      const ride: Ride = {
        id: rideRef.id,
        riderId: user.uid,
        driverId: match.id,
        fromStop: body.fromStop,
        toStop: body.toStop,
        status: "assigned",
        fare,
        priorityFee,
        payMethod: body.payMethod,
        qrToken: mintQrToken(),
        completionPin: mintCompletionPin(),
        createdAt: now,
        seats: body.seats,
        expiresAt: now + PAYMENT_WINDOW_MS,
      };
      tx.set(rideRef, ride);
    });

    // Best-effort: only ping the driver when a NEW pool opens (not on joins).
    if (!match.joining) {
      await dispatchToDriver({
        driverId: match.id,
        rideId: rideRef.id,
        fromName: from.name,
        toName: to.name,
        driverBonusKobo: driverPriorityBonusKobo(priorityFee),
      }).catch((err) => req.log.error({ err }, "driver dispatch failed"));
    }

    return ok({
      rideId: rideRef.id,
      driverId: match.id,
      etaMin: match.etaMin,
      fare,
      seats: body.seats,
      seatsTaken: seatsTakenAfter,
      pooled: match.joining,
      expiresAt: now + PAYMENT_WINDOW_MS,
      stranded: false,
    });
  });

  app.post("/rides/:id/cancel", async (req) => {
    const user = await verifyRequest(req);
    const { id } = RideId.parse(req.params);

    const db = adminDb();
    const ref = db.collection("rides").doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpError("Ride not found", 404);

    const ride = snap.data() as Ride;
    const isRider = ride.riderId === user.uid;
    const isDriver = ride.driverId === user.uid;
    if (!isRider && !isDriver) throw new HttpError("Not your ride", 403);
    if (ride.status === "completed" || ride.status === "cancelled" || ride.status === "expired") {
      throw new HttpError("Ride already closed", 409);
    }

    const from = stopById(ride.fromStop);
    const wasStarted = ride.status === "started";
    const paid = ride.paymentStatus === "PAID";

    // Release this rider's seat back to the keke first (§20.4).
    await freeSeats(ride);

    // Mid-trip cancellation is safety-relevant — flag it (§20.11).
    if (wasStarted && from) {
      await raiseIncident({
        riderId: ride.riderId,
        type: "mid-trip-cancel",
        message: `Ride ${ride.id} cancelled mid-trip by ${isRider ? "rider" : "driver"} (${ride.fromStop} → ${ride.toStop}).`,
        location: `${from.name} (${from.lat},${from.lng})`,
        rideId: ride.id,
      }).catch((err) => req.log.error({ err }, "mid-trip-cancel alert failed"));
    }

    // DRIVER cancels → auto re-match the rider to another keke on the same lane, or
    // strand + flag a refund (§20.4). Shared helper (also used by the stale-driver sweep).
    if (isDriver) {
      const result = await rematchRide(ride);
      return ok({ ok: true, ...result });
    }

    // RIDER cancels → tiered refund policy (H4, §21). Only a PAID ride has anything to
    // refund; the fee (when charged) is credited to the driver as fuel/time comp.
    let refundPending = false;
    if (paid) {
      if (ride.status === "assigned") {
        // Grace period — driver not yet en route. Full refund, no fee.
        refundPending = true;
      } else if (ride.status === "arriving") {
        // Driver already driving to pickup — charge a fee, refund the rest.
        const fee = Math.min(CANCELLATION_FEE_KOBO, ride.fare);
        refundPending = ride.fare > fee;
        await creditDriver(ride.driverId, ride.id, fee, "cancelfee").catch((err) =>
          req.log.error({ err }, "cancellation-fee credit failed"),
        );
      } else if (wasStarted) {
        // Mid-trip — the driver did the job. No refund; driver earns as if completed.
        const earned =
          driverSeatShareKobo(seatFareKobo(ride.seats), PLATFORM_FEE_BPS) +
          driverPriorityBonusKobo(ride.priorityFee);
        await creditDriver(ride.driverId, ride.id, earned, "fare").catch((err) =>
          req.log.error({ err }, "mid-trip fare credit failed"),
        );
      }
    }

    await ref.update({
      status: "cancelled",
      cancelledBy: "rider",
      ...(refundPending ? { refundPending: true } : {}),
    });
    if (ride.driverId) {
      await pingDriver(
        ride.driverId,
        "❌ Pickup cancelled",
        `Ride ${ride.id} (${ride.fromStop} → ${ride.toStop}) was cancelled by the rider.`,
      ).catch((err) => req.log.error({ err }, "rider-cancel driver ping failed"));
    }
    return ok({ ok: true, refundPending });
  });

  // Legal forward transitions the driver can drive the trip through.
  const NEXT_STATUS: Record<string, RideStatus> = {
    assigned: "arriving",
    arriving: "started",
  };

  app.post("/rides/:id/status", async (req) => {
    const user = await verifyRequest(req);
    const { id } = RideId.parse(req.params);
    const body = UpdateRideStatus.parse(req.body);

    const db = adminDb();
    const ref = db.collection("rides").doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpError("Ride not found", 404);

    const ride = snap.data() as Ride;
    if (ride.driverId !== user.uid) throw new HttpError("Not your ride", 403);
    if (ride.status === "completed" || ride.status === "cancelled" || ride.status === "expired") {
      throw new HttpError("Ride already closed", 409);
    }
    if (NEXT_STATUS[ride.status] !== body.status) {
      throw new HttpError(`Cannot move from ${ride.status} to ${body.status}`, 409);
    }
    // A trip can't advance until the rider has paid (§20.2) — an unpaid booking
    // can't tie up the driver; it just sits until it expires. Reduces abuse.
    if (needsPayment(ride)) throw new HttpError("Rider hasn't paid yet", 402);

    // Fan out to every pooled rider currently at the same stage (§20.11): one tap
    // advances the whole keke — but only riders who have PAID move; unpaid peers
    // stay `assigned` and lapse on their own expiry.
    const peers = await db
      .collection("rides")
      .where("driverId", "==", user.uid)
      .where("status", "==", ride.status)
      .get();

    const batch = db.batch();
    let affected = 0;
    for (const doc of peers.docs) {
      if (needsPayment(doc.data() as Ride)) continue;
      batch.update(doc.ref, { status: body.status });
      affected++;
    }
    await batch.commit();

    // Once started, the pool no longer accepts new joins (§20.10).
    if (body.status === "started") {
      await db.collection("drivers").doc(user.uid).set({ poolStarted: true }, { merge: true });
    }

    return ok({ status: body.status, affected });
  });

  app.post("/rides/:id/complete", RATE_LIMIT, async (req) => {
    const user = await verifyRequest(req);
    const { id } = RideId.parse(req.params);
    const body = CompleteRide.parse(req.body);

    const db = adminDb();
    const ref = db.collection("rides").doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpError("Ride not found", 404);

    const ride = snap.data() as Ride;
    if (ride.riderId !== user.uid) throw new HttpError("Only the rider can complete", 403);
    if (ride.status === "completed") throw new HttpError("Ride already completed", 409);
    if (ride.status !== "started") throw new HttpError("Ride not started yet", 409);
    if (needsPayment(ride)) throw new HttpError("Payment not confirmed", 402);

    const supplied = body.qrToken ?? body.pin ?? "";
    const expected = body.qrToken ? ride.qrToken : ride.completionPin;
    if (!verifyQrToken(expected, supplied)) throw new HttpError("Invalid QR code or PIN", 400);

    // Atomically flip to completed so a double-tap/retry can't complete twice (M7).
    const completed = await db.runTransaction(async (tx) => {
      const cur = await tx.get(ref);
      if ((cur.data() as Ride | undefined)?.status !== "started") return false;
      tx.update(ref, { status: "completed" });
      return true;
    });
    if (!completed) throw new HttpError("Ride already completed", 409);

    await freeSeats(ride);

    // Credit the driver (95% seat share + their surge-bonus share) and record the
    // platform's 5% cut for the welfare treasury (§21/P2). Deterministic ids →
    // idempotent, so no double-credit even if this path is retried.
    if (ride.driverId) {
      const driverAmount =
        driverSeatShareKobo(seatFareKobo(ride.seats), PLATFORM_FEE_BPS) +
        driverPriorityBonusKobo(ride.priorityFee);
      await creditDriver(ride.driverId, ride.id, driverAmount, "fare");
      const platformCut = platformCutKobo(seatFareKobo(ride.seats), PLATFORM_FEE_BPS);
      await db
        .collection("treasuryContributions")
        .doc(ride.id)
        .set(
          { rideId: ride.id, driverId: ride.driverId, amount: platformCut, createdAt: Date.now() },
          { merge: true },
        );
    }

    return ok({ ok: true, fare: ride.fare });
  });

  app.get("/rides/:id/qr", async (req) => {
    const user = await verifyRequest(req);
    const { id } = RideId.parse(req.params);

    const snap = await adminDb().collection("rides").doc(id).get();
    if (!snap.exists) throw new HttpError("Ride not found", 404);

    const ride = snap.data() as Ride;
    if (ride.driverId !== user.uid) throw new HttpError("Not your ride", 403);

    return ok({ qrToken: ride.qrToken, pin: ride.completionPin });
  });

  app.post("/rides/:id/rate", async (req) => {
    const user = await verifyRequest(req);
    const { id } = RideId.parse(req.params);
    const body = RateRide.parse(req.body);

    const db = adminDb();
    const snap = await db.collection("rides").doc(id).get();
    if (!snap.exists) throw new HttpError("Ride not found", 404);

    const ride = snap.data() as Ride;
    if (ride.riderId !== user.uid) throw new HttpError("Only the rider can rate", 403);
    if (ride.status !== "completed") throw new HttpError("Rate only after the ride is completed", 409);

    // One rating per ride: the rating doc id is the ride id (idempotent guard).
    const ratingRef = db.collection("ratings").doc(id);
    if ((await ratingRef.get()).exists) throw new HttpError("Ride already rated", 409);

    await ratingRef.set({
      id: ratingRef.id,
      rideId: id,
      driverId: ride.driverId,
      stars: body.stars,
      ...(body.comment ? { comment: body.comment } : {}),
    });

    if (ride.driverId) {
      await db
        .collection("drivers")
        .doc(ride.driverId)
        .set(
          { ratingSum: FieldValue.increment(body.stars), ratingCount: FieldValue.increment(1) },
          { merge: true },
        );
    }
    return ok({ ok: true });
  });
}
