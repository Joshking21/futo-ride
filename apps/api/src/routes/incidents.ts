import type { FastifyInstance } from "fastify";
import { verifyRequest } from "../lib/auth.js";
import { ok, HttpError } from "../lib/http.js";
import { adminDb } from "../lib/firestore.js";
import { raiseIncident, mapsLink } from "../lib/incidents.js";
import { Sos, ReportIncident } from "../schemas/incidents.js";
import type { Ride } from "../types/index.js";

const RATE_LIMIT = { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } };

/**
 * A `rideId` is private — the rider gets it from booking, the driver from dispatch, and
 * pooled riders each have their OWN id — so only people ON the ride can supply it. If one
 * is provided it MUST belong to the caller (rider or driver); a mismatch is rejected, not
 * flagged (you can't report on a ride you're not on). SOS with no rideId is still allowed.
 */
async function assertRideAccess(rideId: string | undefined, uid: string): Promise<void> {
  if (!rideId) return;
  const snap = await adminDb().collection("rides").doc(rideId).get();
  if (!snap.exists) throw new HttpError("Ride not found", 404);
  const ride = snap.data() as Ride;
  if (ride.riderId !== uid && ride.driverId !== uid) throw new HttpError("Not your ride", 403);
}

export default async function incidentRoutes(app: FastifyInstance) {
  app.post("/sos", RATE_LIMIT, async (req) => {
    const user = await verifyRequest(req);
    const body = Sos.parse(req.body);
    await assertRideAccess(body.rideId, user.uid);

    const incidentId = await raiseIncident({
      reporterUid: user.uid,
      type: "sos",
      message: body.message ?? "Rider triggered SOS.",
      location: mapsLink(body.lat, body.lng),
      rideId: body.rideId,
    });
    return ok({ incidentId });
  });

  app.post("/incidents/report", RATE_LIMIT, async (req) => {
    const user = await verifyRequest(req);
    const body = ReportIncident.parse(req.body);
    await assertRideAccess(body.rideId, user.uid);

    const incidentId = await raiseIncident({
      reporterUid: user.uid,
      type: body.type,
      message: body.message,
      location: mapsLink(body.lat, body.lng),
      rideId: body.rideId,
    });
    return ok({ incidentId });
  });
}
