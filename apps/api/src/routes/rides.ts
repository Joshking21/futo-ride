import type { FastifyInstance } from "fastify";
import { FieldValue } from "firebase-admin/firestore";
import { verifyRequest } from "../lib/auth.js";
import { adminDb } from "../lib/firestore.js";
import { ok, HttpError } from "../lib/http.js";
import { CAMPUS_STOPS } from "../lib/campus-stops.js";
import { seatFareKobo } from "../lib/fare.js";
import { evaluateSurge, driverPriorityBonusKobo } from "../lib/surge.js";
import { mintQrToken, mintCompletionPin, verifyQrToken } from "../lib/qr.js";
import { PAYMENT_WINDOW_MS, DRIVER_HEARTBEAT_MS } from "../lib/config.js";
import {
  onlineKekes,
  matchKeke,
  freeSeats,
  sweepExpiredRides,
  DEFAULT_CAPACITY,
  type Stop,
} from "../lib/matching.js";
import { dispatchToDriver, pingDriver } from "../lib/dispatch.js";
import { raiseIncident } from "../lib/incidents.js";
import { BookRide, CompleteRide, RateRide, RideId, UpdateRideStatus } from "../schemas/rides.js";
import type { Ride, RideStatus } from "../types/index.js";

const ACTIVE_STATUSES: RideStatus[] = ["assigned", "arriving", "started"];

function stopById(id: string): Stop | undefined {
  return CAMPUS_STOPS.find((s) => s.id === id);
}

/** True if the ride still needs (naira) payment before it can complete (§20.2). */
function needsPayment(ride: Ride): boolean {
  return ride.payMethod === "naira" && ride.paymentStatus !== "PAID";
}

export default async function rideRoutes(app: FastifyInstance) {
  app.post("/rides", { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } }, async (req) => {
    const user = await verifyRequest(req);
    const body = BookRide.parse(req.body);

    const from = stopById(body.fromStop);
    const to = stopById(body.toStop);
    if (!from || !to) throw new HttpError("Unknown stop", 400);

    const db = adminDb();

    // Free any lapsed unpaid holds first so their seats are available to match (§20.1).
    await sweepExpiredRides().catch((err) => req.log.error({ err }, "expiry sweep failed"));

    // One active ride per rider (§20.10): block a second in-progress ride.
    const active = await db
      .collection("rides")
      .where("riderId", "==", user.uid)
      .where("status", "in", ACTIVE_STATUSES)
      .limit(1)
      .get();
    if (!active.empty) throw new HttpError("You already have an active ride", 409);

    // Reuse an existing stranded ("requested") ride so retries don't pile up docs
    // or inflate the surge pending-count (§20.10 / F8).
    const strandedSnap = await db
      .collection("rides")
      .where("riderId", "==", user.uid)
      .where("status", "==", "requested")
      .limit(1)
      .get();
    const reuseRef = strandedSnap.empty ? null : strandedSnap.docs[0].ref;

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

    const cancelledBy = isRider ? "rider" : "driver";
    const wasStarted = ride.status === "started";
    const from = stopById(ride.fromStop);
    const to = stopById(ride.toStop);

    // Release this driver's seat first (§20.4).
    await freeSeats(ride);

    // Mid-trip cancellation is safety-relevant — flag it (§20.11).
    if (wasStarted && from) {
      await raiseIncident({
        riderId: ride.riderId,
        type: "mid-trip-cancel",
        message: `Ride ${ride.id} cancelled mid-trip by ${cancelledBy} (${ride.fromStop} → ${ride.toStop}).`,
        location: `${from.name} (${from.lat},${from.lng})`,
        rideId: ride.id,
      }).catch((err) => req.log.error({ err }, "mid-trip-cancel alert failed"));
    }

    if (isDriver && from && to) {
      // Driver bailed — try to re-match the rider to another keke (§20.4).
      const kekes = await onlineKekes();
      const rematch = matchKeke(from, ride.toStop, ride.seats, kekes, ride.driverId);
      if (rematch) {
        const newDriverRef = db.collection("drivers").doc(rematch.id);
        await db.runTransaction(async (tx) => {
          const dSnap = await tx.get(newDriverRef);
          const d = dSnap.data() ?? {};
          const capacity = typeof d.capacity === "number" ? d.capacity : DEFAULT_CAPACITY;
          const seatsTaken = typeof d.seatsTaken === "number" ? d.seatsTaken : 0;
          if (capacity - seatsTaken < ride.seats) {
            throw new HttpError("Keke just filled up, try again", 409);
          }
          tx.update(newDriverRef, {
            seatsTaken: seatsTaken + ride.seats,
            poolFromStop: ride.fromStop,
            poolToStop: ride.toStop,
          });
          tx.update(ref, {
            driverId: rematch.id,
            status: "assigned",
            qrToken: mintQrToken(),
            completionPin: mintCompletionPin(),
            cancelledBy: FieldValue.delete(),
            // A paid ride keeps its payment; an unpaid one gets a fresh hold.
            ...(needsPayment(ride) ? { expiresAt: Date.now() + PAYMENT_WINDOW_MS } : {}),
          });
        });

        if (!rematch.joining) {
          await dispatchToDriver({
            driverId: rematch.id,
            rideId: ride.id,
            fromName: from.name,
            toName: to.name,
            driverBonusKobo: driverPriorityBonusKobo(ride.priorityFee),
          }).catch((err) => req.log.error({ err }, "re-match dispatch failed"));
        }
        return ok({ ok: true, rematched: true, newDriverId: rematch.id });
      }

      // No keke free — strand the rider and flag a refund if they'd paid.
      const refundPending = ride.paymentStatus === "PAID";
      await ref.update({
        driverId: "",
        status: "requested",
        cancelledBy: "driver",
        ...(refundPending ? { refundPending: true } : {}),
        expiresAt: FieldValue.delete(),
      });
      if (from) {
        await raiseIncident({
          riderId: ride.riderId,
          type: "stranded",
          message: `Driver cancelled ride ${ride.id}; no replacement keke for ${ride.fromStop} → ${ride.toStop}${refundPending ? " (paid — refund pending)" : ""}.`,
          location: `${from.name} (${from.lat},${from.lng})`,
          rideId: ride.id,
        }).catch((err) => req.log.error({ err }, "driver-cancel strand alert failed"));
      }
      return ok({ ok: true, rematched: false, refundPending });
    }

    // Rider cancelled — close the ride and warn the assigned driver (no ghost pickup).
    await ref.update({ status: "cancelled", cancelledBy: "rider" });
    if (ride.driverId) {
      await pingDriver(
        ride.driverId,
        "❌ Pickup cancelled",
        `Ride ${ride.id} (${ride.fromStop} → ${ride.toStop}) was cancelled by the rider.`,
      ).catch((err) => req.log.error({ err }, "rider-cancel driver ping failed"));
    }
    return ok({ ok: true });
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

  app.post("/rides/:id/complete", async (req) => {
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

    await ref.update({ status: "completed" });
    await freeSeats(ride);

    // Credit the driver's earnings ledger: seat fare + their share of any surge fee.
    if (ride.driverId) {
      const amount = seatFareKobo(ride.seats) + driverPriorityBonusKobo(ride.priorityFee);
      const earningRef = db.collection("earnings").doc();
      await earningRef.set({
        id: earningRef.id,
        driverId: ride.driverId,
        rideId: ride.id,
        amount,
        createdAt: Date.now(),
      });
      await db
        .collection("drivers")
        .doc(ride.driverId)
        .set({ earningsKobo: FieldValue.increment(amount) }, { merge: true });
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
