import type { FastifyInstance } from "fastify";
import { FieldValue } from "firebase-admin/firestore";
import { verifyRequest } from "../lib/auth.js";
import { adminDb } from "../lib/firestore.js";
import { ok, HttpError } from "../lib/http.js";
import { CAMPUS_STOPS } from "../lib/campus-stops.js";
import { findNearest } from "../lib/geo.js";
import { baseFareKobo } from "../lib/fare.js";
import { evaluateSurge, driverPriorityBonusKobo } from "../lib/surge.js";
import { mintQrToken, verifyQrToken } from "../lib/qr.js";
import { sendTelegramAlert } from "../lib/alerta.js";
import { raiseIncident } from "../lib/incidents.js";
import { BookRide, CompleteRide, RateRide, RideId, UpdateRideStatus } from "../schemas/rides.js";
import type { Ride, RideStatus } from "../types/index.js";

type OnlineKeke = { id: string; lat: number; lng: number };

function stopById(id: string) {
  return CAMPUS_STOPS.find((s) => s.id === id);
}

/** Online kekes as geo points for matching. */
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
      kekes.push({ id: doc.id, lat: d.currentLat, lng: d.currentLng });
    }
  }
  return kekes;
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
    const [match, surge] = await Promise.all([
      onlineKekes().then((kekes) => findNearest(from, kekes)),
      evaluateSurge(body.fromStop),
    ]);

    const priorityFee = surge === "on" ? (body.priorityFee ?? 0) : 0;
    const fare = baseFareKobo(match?.distKm ?? 0) + priorityFee;
    const now = Date.now();

    if (!match) {
      // Stranded student: no keke available. Record the request, then raise a HIGH
      // incident so SUG Security is aware (esp. at night). Best-effort: a triage/
      // Alerta failure must never mask the 409 the rider needs to see.
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
      };
      await ref.set(ride);

      await raiseIncident({
        riderId: user.uid,
        type: "stranded",
        message: `No keke available for a rider requesting ${from.name} → ${to.name}.`,
        location: `${from.name} (${from.lat},${from.lng})`,
        rideId: ref.id,
      }).catch((err) => req.log.error({ err }, "stranded-student alert failed"));

      throw new HttpError("No keke available right now", 409);
    }

    const ref = db.collection("rides").doc();
    const ride: Ride = {
      id: ref.id,
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
    };
    await ref.set(ride);

    // Best-effort: a Telegram failure must not fail a successful booking.
    await dispatchToDriver({
      driverId: match.id,
      fromName: from.name,
      toName: to.name,
      driverBonusKobo: driverPriorityBonusKobo(priorityFee),
    }).catch((err) => req.log.error({ err }, "driver dispatch failed"));

    return ok({ rideId: ride.id, driverId: ride.driverId, etaMin: match.etaMin, fare });
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
