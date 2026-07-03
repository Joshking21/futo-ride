import type { FastifyInstance } from "fastify";
import { verifyRequest } from "../lib/auth.js";
import { adminDb } from "../lib/firestore.js";
import { ok, HttpError } from "../lib/http.js";
import { GoOnline, UpdateLocation, DriverId } from "../schemas/drivers.js";

/** Driver availability + location. The driver doc id is the driver's uid. */
export default async function driverRoutes(app: FastifyInstance) {
  app.post("/drivers/online", async (req) => {
    const user = await verifyRequest(req);
    const body = GoOnline.parse(req.body);

    const update: Record<string, unknown> = { online: body.online };
    if (body.lat !== undefined) update.currentLat = body.lat;
    if (body.lng !== undefined) update.currentLng = body.lng;

    await adminDb().collection("drivers").doc(user.uid).set(update, { merge: true });
    return ok({ online: body.online });
  });

  app.post("/drivers/location", async (req) => {
    const user = await verifyRequest(req);
    const body = UpdateLocation.parse(req.body);

    await adminDb()
      .collection("drivers")
      .doc(user.uid)
      .set({ currentLat: body.lat, currentLng: body.lng }, { merge: true });
    return ok({ ok: true });
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
