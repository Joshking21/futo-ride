import type { FastifyInstance } from "fastify";
import { verifyRequest } from "../lib/auth.js";
import { adminDb } from "../lib/firestore.js";
import { ok, HttpError } from "../lib/http.js";
import { BUS_ROUTES } from "../lib/routes.js";
import { resolveRoute, etaAlongRoute, isBusNearStop } from "../lib/bus.js";
import { sendMessage } from "../lib/telegram.js";
import { sendPush } from "../lib/fcm.js";
import { RouteId, RouteEtaQuery, ProximityOptIn, BusLocation, RegisterBus } from "../schemas/buses.js";

type LatLng = { lat: number; lng: number };

/** A proximity subscription auto-expires after this idle window (§20.13). */
const SUB_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Fires a Telegram ping + FCM push to each rider whose subscribed stop the bus has just
 * reached, and re-arms subscriptions once the bus leaves the radius. De-dupes
 * via a `notifiedAt` flag so each approach pings once. Subscriptions past their
 * TTL are auto-disabled so a stale opt-in never pings forever (§20.13).
 */
async function notifyProximity(routeId: string, busPos: LatLng): Promise<void> {
  const db = adminDb();
  const subs = await db
    .collection("busProximitySubs")
    .where("routeId", "==", routeId)
    .where("enabled", "==", true)
    .get();
  if (subs.empty) return;

  const route = resolveRoute(routeId);
  const routeName = route?.name ?? routeId;
  const now = Date.now();

  for (const doc of subs.docs) {
    const sub = doc.data() as {
      userId: string;
      stopId: string;
      notifiedAt?: number;
      expiresAt?: number;
    };

    // Stale opt-in — retire it and move on.
    if ((sub.expiresAt ?? 0) < now) {
      await doc.ref.update({ enabled: false });
      continue;
    }

    const near = isBusNearStop(routeId, sub.stopId, busPos);

    if (near && !sub.notifiedAt) {
      const stop = route?.stops.find((s) => s.id === sub.stopId);
      const title = "🚌 Bus approaching";
      const body = `The ${routeName} bus is near ${stop?.name ?? sub.stopId}.`;

      // Telegram DM + FCM push in parallel (both best-effort).
      const userSnap = await db.collection("users").doc(sub.userId).get();
      const chatId = userSnap.data()?.chatId as string | undefined;
      await Promise.all([
        chatId ? sendMessage(chatId, `${title}\n${body}`).catch(() => undefined) : Promise.resolve(),
        sendPush(sub.userId, {
          title,
          body,
          data: { type: "bus_proximity", routeId, stopId: sub.stopId },
        }),
      ]);
      await doc.ref.update({ notifiedAt: Date.now() });
    } else if (!near && sub.notifiedAt) {
      await doc.ref.update({ notifiedAt: null });
    }
  }
}

/** Bus tracker: route metadata, ETA-to-stop from a live position, proximity opt-in. */
export default async function busRoutes(app: FastifyInstance) {
  app.get("/buses/routes", async () => {
    const routes = BUS_ROUTES.map((r) => {
      const resolved = resolveRoute(r.id);
      return { id: r.id, name: r.name, stops: resolved?.stops ?? [] };
    });
    return ok({ routes });
  });

  app.get("/buses/routes/:id/eta", async (req) => {
    const { id } = RouteId.parse(req.params);
    const { lat, lng } = RouteEtaQuery.parse(req.query);

    const etas = etaAlongRoute(id, { lat, lng });
    if (!etas) throw new HttpError("Unknown route", 404);
    return ok({ routeId: id, stops: etas });
  });

  // Explicit bus-driver onboarding (§21/H6) — call once before posting positions.
  // No whitelist (buses are lower-stakes than keke dispatch), but a real register step
  // stops any authenticated student from silently corrupting the tracker, and refuses to
  // convert an existing keke driver (which used to remove them from keke matching).
  app.post("/buses/register", async (req) => {
    const user = await verifyRequest(req);
    const body = RegisterBus.parse(req.body);

    if (!resolveRoute(body.routeId)) throw new HttpError("Unknown route", 404);

    const ref = adminDb().collection("drivers").doc(user.uid);
    const snap = await ref.get();
    if (snap.data()?.vehicleType === "keke") {
      throw new HttpError("Already registered as a keke driver", 409);
    }

    await ref.set(
      { id: user.uid, name: body.name, plate: body.plate, vehicleType: "bus", routeId: body.routeId },
      { merge: true },
    );
    return ok({ id: user.uid, name: body.name, plate: body.plate, vehicleType: "bus", routeId: body.routeId });
  });

  app.post("/buses/location", async (req) => {
    const user = await verifyRequest(req);
    const body = BusLocation.parse(req.body);

    if (!resolveRoute(body.routeId)) throw new HttpError("Unknown route", 404);

    const ref = adminDb().collection("drivers").doc(user.uid);
    const snap = await ref.get();
    // Must be a registered bus driver (§21/H6): blocks random students and prevents a
    // keke driver's doc from being flipped to "bus" (which silently unmatched them).
    if (snap.data()?.vehicleType !== "bus") {
      throw new HttpError("Register as a bus driver first", 403);
    }

    await ref.set(
      {
        routeId: body.routeId,
        currentLat: body.lat,
        currentLng: body.lng,
        lastSeenAt: Date.now(),
      },
      { merge: true },
    );

    await notifyProximity(body.routeId, { lat: body.lat, lng: body.lng });
    return ok({ ok: true });
  });

  app.post("/buses/proximity", async (req) => {
    const user = await verifyRequest(req);
    const body = ProximityOptIn.parse(req.body);

    const route = resolveRoute(body.routeId);
    if (!route) throw new HttpError("Unknown route", 404);
    if (!route.stops.some((s) => s.id === body.stopId)) {
      throw new HttpError("Stop is not on this route", 400);
    }

    const docId = `${user.uid}_${body.routeId}_${body.stopId}`;
    await adminDb()
      .collection("busProximitySubs")
      .doc(docId)
      .set(
        {
          userId: user.uid,
          routeId: body.routeId,
          stopId: body.stopId,
          enabled: body.enabled,
          expiresAt: Date.now() + SUB_TTL_MS, // refreshed each opt-in; auto-retires when stale (§20.13)
        },
        { merge: true },
      );

    return ok({ enabled: body.enabled });
  });
}
