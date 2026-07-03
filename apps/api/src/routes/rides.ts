import type { FastifyInstance } from "fastify";
import { FieldValue } from "firebase-admin/firestore";
import { verifyRequest } from "../lib/auth.js";
import { adminDb } from "../lib/firestore.js";
import { ok, HttpError } from "../lib/http.js";
import { CAMPUS_STOPS } from "../lib/campus-stops.js";
import { findNearest } from "../lib/geo.js";
import { seatFareKobo } from "../lib/fare.js";
import { evaluateSurge, driverPriorityBonusKobo } from "../lib/surge.js";
import { mintQrToken, verifyQrToken } from "../lib/qr.js";
import { sendTelegramAlert } from "../lib/alerta.js";
import { raiseIncident } from "../lib/incidents.js";
import { BookRide, CompleteRide, RateRide, RideId, UpdateRideStatus } from "../schemas/rides.js";
import type { Ride, RideStatus } from "../types/index.js";

const DEFAULT_CAPACITY = 4;

type Stop = { id: string; name: string; lat: number; lng: number };

/** An online keke with its live seat state, for pooling (§6a). */
type OnlineKeke = {
  id: string;
  lat: number;
  lng: number;
  capacity: number;
  seatsTaken: number;
  poolToStop?: string;
};

function stopById(id: string) {
  return CAMPUS_STOPS.find((s) => s.id === id);
}

/**
 * Releases a ride's seats back to its keke when the ride ends (complete/cancel).
 * Decrements `seatsTaken` transactionally, flooring at 0, and clears `poolToStop`
 * once the keke is empty so it's free to open a new pool to a different stop.
 * No-op for the stranded/unassigned case (no driver).
 */
async function freeSeats(ride: Ride): Promise<void> {
  if (!ride.driverId) return;
  const db = adminDb();
  const driverRef = db.collection("drivers").doc(ride.driverId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(driverRef);
    if (!snap.exists) return;
    const d = snap.data() ?? {};
    const seatsTaken = typeof d.seatsTaken === "number" ? d.seatsTaken : 0;
    const seats = typeof ride.seats === "number" ? ride.seats : 1;
    const next = Math.max(0, seatsTaken - seats);
    tx.update(driverRef, {
      seatsTaken: next,
      ...(next === 0 ? { poolToStop: FieldValue.delete() } : {}),
    });
  });
}

/** Online kekes with seat state, for seat-aware matching. */
async function onlineKekes(): Promise<OnlineKeke[]> {
  const snap = await adminDb()
    .collection("drivers")
    .where("online", "==", true)
    .where("vehicleType", "==", "keke")
    .get();

  const kekes: OnlineKeke[] = [];
  for (const doc of snap.docs) {
    const d = doc.data();
    if (typeof d.currentLat === "number" && typeof d.currentLng === "number") {
      kekes.push({
        id: doc.id,
        lat: d.currentLat,
        lng: d.currentLng,
        capacity: typeof d.capacity === "number" ? d.capacity : DEFAULT_CAPACITY,
        seatsTaken: typeof d.seatsTaken === "number" ? d.seatsTaken : 0,
        poolToStop: d.poolToStop as string | undefined,
      });
    }
  }
  return kekes;
}

/**
 * Seat-aware keke matcher (§6a). Prefers JOINING an existing pool already heading
 * to `toStop` with enough free seats (nearest to pickup); otherwise opens a NEW
 * pool on the nearest fully-free keke that can seat the party. Returns the chosen
 * keke + distance/ETA, or null when nothing can seat the request.
 */
function matchKeke(
  from: Stop,
  toStop: string,
  seats: number,
  kekes: OnlineKeke[],
): (OnlineKeke & { distKm: number; etaMin: number; joining: boolean }) | null {
  const freeSeats = (k: OnlineKeke) => k.capacity - k.seatsTaken;

  // 1) Existing pools to the same destination with room — nearest wins.
  const pools = kekes.filter(
    (k) => k.seatsTaken > 0 && k.poolToStop === toStop && freeSeats(k) >= seats,
  );
  const joinable = findNearest(from, pools);
  if (joinable) return { ...joinable, joining: true };

  // 2) Otherwise a fully-free keke that can seat the party — nearest wins.
  const idle = kekes.filter((k) => k.seatsTaken === 0 && freeSeats(k) >= seats);
  const fresh = findNearest(from, idle);
  if (fresh) return { ...fresh, joining: false };

  return null;
}

/**
 * Dispatches an assignment to the driver over Telegram (driver stays blind to
 * bidding — assignment only, §12). Includes the surge bonus when one applies so
 * the signal pulls more kekes onto the road. Best-effort: never blocks booking.
 */
async function dispatchToDriver(params: {
  driverId: string;
  fromName: string;
  toName: string;
  driverBonusKobo: number;
}): Promise<void> {
  const { driverId, fromName, toName, driverBonusKobo } = params;
  const snap = await adminDb().collection("drivers").doc(driverId).get();
  const chatId = snap.data()?.chatId as string | undefined;
  if (!chatId) return;

  const bonusLine =
    driverBonusKobo > 0 ? ` — 🔥 surge bonus +₦${(driverBonusKobo / 100).toFixed(2)}` : "";
  await sendTelegramAlert(
    {
      title: "📍 New pickup",
      severity: "info",
      message: `${fromName} → ${toName}${bonusLine}`,
    },
    chatId,
  );
}

export default async function rideRoutes(app: FastifyInstance) {
  app.post("/rides", async (req) => {
    const user = await verifyRequest(req);
    const body = BookRide.parse(req.body);

    const from = stopById(body.fromStop);
    const to = stopById(body.toStop);
    if (!from || !to) throw new HttpError("Unknown stop", 400);

    const db = adminDb();
    const [kekes, surge] = await Promise.all([onlineKekes(), evaluateSurge(body.fromStop)]);

    const match = matchKeke(from, body.toStop, body.seats, kekes);
    const priorityFee = surge === "on" ? (body.priorityFee ?? 0) : 0;
    const fare = seatFareKobo(body.seats) + priorityFee;
    const now = Date.now();

    if (!match) {
      // Stranded student: no keke can seat the party. Record the request, then raise
      // a HIGH incident so SUG Security is aware (esp. at night). Best-effort: a
      // triage/Alerta failure must never mask the 409 the rider needs to see.
      const ref = db.collection("rides").doc();
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
        createdAt: now,
        seats: body.seats,
      };
      await ref.set(ride);

      await raiseIncident({
        riderId: user.uid,
        type: "stranded",
        message: `No keke seat available for a rider requesting ${from.name} → ${to.name} (${body.seats} seat(s)).`,
        location: `${from.name} (${from.lat},${from.lng})`,
        rideId: ref.id,
      }).catch((err) => req.log.error({ err }, "stranded-student alert failed"));

      throw new HttpError("No keke available right now", 409);
    }

    // Claim the seats atomically on the driver doc so two riders can't overfill the
    // same keke. Re-check free seats inside the transaction against live state.
    const rideRef = db.collection("rides").doc();
    const driverRef = db.collection("drivers").doc(match.id);
    try {
      await db.runTransaction(async (tx) => {
        const dSnap = await tx.get(driverRef);
        const d = dSnap.data() ?? {};
        const capacity = typeof d.capacity === "number" ? d.capacity : DEFAULT_CAPACITY;
        const seatsTaken = typeof d.seatsTaken === "number" ? d.seatsTaken : 0;
        const currentPool = d.poolToStop as string | undefined;

        // If this keke already has a pool, it must be to the same destination.
        if (seatsTaken > 0 && currentPool && currentPool !== body.toStop) {
          throw new HttpError("Keke just filled up, try again", 409);
        }
        if (capacity - seatsTaken < body.seats) {
          throw new HttpError("Keke just filled up, try again", 409);
        }

        tx.update(driverRef, {
          seatsTaken: seatsTaken + body.seats,
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
          createdAt: now,
          seats: body.seats,
        };
        tx.set(rideRef, ride);
      });
    } catch (err) {
      if (err instanceof HttpError) throw err;
      throw err;
    }

    // Best-effort: a Telegram failure must not fail a successful booking. Only ping
    // the driver when a NEW pool opens (not on every join) to avoid spamming.
    if (!match.joining) {
      await dispatchToDriver({
        driverId: match.id,
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
      pooled: match.joining,
    });
  });

  app.post("/rides/:id/cancel", async (req) => {
    const user = await verifyRequest(req);
    const { id } = RideId.parse(req.params);

    const ref = adminDb().collection("rides").doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpError("Ride not found", 404);

    const ride = snap.data() as Ride;
    if (ride.riderId !== user.uid && ride.driverId !== user.uid) {
      throw new HttpError("Not your ride", 403);
    }
    if (ride.status === "completed" || ride.status === "cancelled") {
      throw new HttpError("Ride already closed", 409);
    }

    await ref.update({ status: "cancelled" });
    await freeSeats(ride);
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

    const ref = adminDb().collection("rides").doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpError("Ride not found", 404);

    const ride = snap.data() as Ride;
    if (ride.driverId !== user.uid) throw new HttpError("Not your ride", 403);
    if (ride.status === "completed" || ride.status === "cancelled") {
      throw new HttpError("Ride already closed", 409);
    }

    // Enforce ordered progression: assigned→arriving→started only.
    if (NEXT_STATUS[ride.status] !== body.status) {
      throw new HttpError(
        `Cannot move from ${ride.status} to ${body.status}`,
        409,
      );
    }

    await ref.update({ status: body.status });
    return ok({ status: body.status });
  });

  app.post("/rides/:id/complete", async (req) => {
    const user = await verifyRequest(req);
    const { id } = RideId.parse(req.params);
    const body = CompleteRide.parse(req.body);

    const ref = adminDb().collection("rides").doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpError("Ride not found", 404);

    const ride = snap.data() as Ride;
    if (ride.riderId !== user.uid) throw new HttpError("Only the rider can complete", 403);
    if (ride.status === "completed") throw new HttpError("Ride already completed", 409);
    if (!ride.qrToken || !verifyQrToken(ride.qrToken, body.qrToken)) {
      throw new HttpError("Invalid QR code", 400);
    }

    await ref.update({ status: "completed" });
    await freeSeats(ride);
    return ok({ ok: true, fare: ride.fare });
  });

  app.get("/rides/:id/qr", async (req) => {
    const user = await verifyRequest(req);
    const { id } = RideId.parse(req.params);

    const snap = await adminDb().collection("rides").doc(id).get();
    if (!snap.exists) throw new HttpError("Ride not found", 404);

    const ride = snap.data() as Ride;
    if (ride.driverId !== user.uid) throw new HttpError("Not your ride", 403);

    return ok({ qrToken: ride.qrToken });
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
