import type { FastifyInstance } from "fastify";
import { verifyRequest } from "../lib/auth.js";
import { adminDb } from "../lib/firestore.js";
import { ok, HttpError } from "../lib/http.js";
import { isApprovedDriver } from "../lib/whitelist.js";
import { GoOnline, UpdateLocation, DriverId, RegisterDriver } from "../schemas/drivers.js";
import type { Ride, RideStatus } from "../types/index.js";

const DEFAULT_CAPACITY = 4;
const ACTIVE_STATUSES: RideStatus[] = ["assigned", "arriving", "started"];

/** Driver availability + location. The driver doc id is the driver's uid. */
export default async function driverRoutes(app: FastifyInstance) {
  app.post("/drivers/register", async (req) => {
    const user = await verifyRequest(req);
    const body = RegisterDriver.parse(req.body);

    if (!(await isApprovedDriver(user.uid, user.email))) {
      throw new HttpError("Not an approved driver", 403);
    }

    const ref = adminDb().collection("drivers").doc(user.uid);
    await ref.set(
      {
        id: user.uid,
        name: body.name,
        plate: body.plate,
        vehicleType: "keke",
        capacity: DEFAULT_CAPACITY,
      },
      { merge: true },
    );
    return ok({
      id: user.uid,
      name: body.name,
      plate: body.plate,
      vehicleType: "keke",
      capacity: DEFAULT_CAPACITY,
    });
  });

  app.post("/drivers/online", async (req) => {
    const user = await verifyRequest(req);
    const body = GoOnline.parse(req.body);

    const ref = adminDb().collection("drivers").doc(user.uid);
    const snap = await ref.get();
    if (snap.data()?.vehicleType !== "keke") {
      throw new HttpError("Register as a keke driver first", 403);
    }

    const update: Record<string, unknown> = { online: body.online, lastSeenAt: Date.now() };
    if (body.lat !== undefined) update.currentLat = body.lat;
    if (body.lng !== undefined) update.currentLng = body.lng;

    await ref.set(update, { merge: true });
    return ok({ online: body.online });
  });

  app.post("/drivers/location", async (req) => {
    const user = await verifyRequest(req);
    const body = UpdateLocation.parse(req.body);

    await adminDb()
      .collection("drivers")
      .doc(user.uid)
      .set({ currentLat: body.lat, currentLng: body.lng, lastSeenAt: Date.now() }, { merge: true });
    return ok({ ok: true });
  });

  app.get("/drivers/me/rides", async (req) => {
    const user = await verifyRequest(req);

    const snap = await adminDb()
      .collection("rides")
      .where("driverId", "==", user.uid)
      .where("status", "in", ACTIVE_STATUSES)
      .get();

    const rides = snap.docs.map((doc) => {
      const r = doc.data() as Ride;
      return {
        rideId: r.id,
        fromStop: r.fromStop,
        toStop: r.toStop,
        status: r.status,
        seats: r.seats,
        riderId: r.riderId,
      };
    });
    return ok({ rides });
  });

  app.get("/drivers/me/earnings", async (req) => {
    const user = await verifyRequest(req);
    const db = adminDb();

    const driverSnap = await db.collection("drivers").doc(user.uid).get();
    const totalKobo =
      typeof driverSnap.data()?.earningsKobo === "number" ? driverSnap.data()!.earningsKobo : 0;

    // Query on the equality field only (auto-indexed); sort + cap in memory so no
    // composite index is needed. A driver's ledger is bounded by their completed rides.
    const recentSnap = await db.collection("earnings").where("driverId", "==", user.uid).get();
    const recent = recentSnap.docs
      .map((doc) => doc.data())
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
      .slice(0, 10)
      .map((e) => ({ rideId: e.rideId, amount: e.amount, createdAt: e.createdAt }));

    return ok({ totalKobo, recent });
  });

  app.get("/drivers/:id/rating", async (req) => {
    const { id } = DriverId.parse(req.params);

    const snap = await adminDb().collection("drivers").doc(id).get();
    if (!snap.exists) throw new HttpError("Driver not found", 404);

    const d = snap.data() ?? {};
    const count = typeof d.ratingCount === "number" ? d.ratingCount : 0;
    const sum = typeof d.ratingSum === "number" ? d.ratingSum : 0;
    const average = count > 0 ? Math.round((sum / count) * 10) / 10 : null;
    return ok({ average, count });
  });
}
