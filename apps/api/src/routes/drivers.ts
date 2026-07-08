import type { FastifyInstance } from "fastify";
import { FieldValue } from "firebase-admin/firestore";
import { verifyRequest } from "../lib/auth.js";
import { adminDb } from "../lib/firestore.js";
import { ok, HttpError } from "../lib/http.js";
import { isApprovedDriver } from "../lib/whitelist.js";
import { GoOnline, UpdateLocation, DriverId, RegisterDriver, WithdrawEarnings } from "../schemas/drivers.js";
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

    // Indexed query: newest 10 credits for this driver (composite index
    // earnings[driverId ASC, createdAt DESC] in firestore.indexes.json). No in-memory sort.
    const recentSnap = await db
      .collection("earnings")
      .where("driverId", "==", user.uid)
      .orderBy("createdAt", "desc")
      .limit(10)
      .get();
    const recent = recentSnap.docs.map((doc) => {
      const e = doc.data();
      return { rideId: e.rideId, amount: e.amount, createdAt: e.createdAt };
    });

    return ok({ totalKobo, recent });
  });

  app.post("/drivers/me/withdraw", async (req) => {
    const user = await verifyRequest(req);
    const body = WithdrawEarnings.parse(req.body);

    const db = adminDb();
    const driverRef = db.collection("drivers").doc(user.uid);
    const wRef = db.collection("withdrawals").doc();

    // Debit the ledger transactionally so a driver can't overdraw or race two withdrawals
    // (§21/P3). The real payout — Partna offramp to bank, or on-chain USDC to the wallet —
    // is a deferred step; the withdrawal record stays "pending" until then (like refunds).
    await db.runTransaction(async (tx) => {
      const dSnap = await tx.get(driverRef);
      if (!dSnap.exists) throw new HttpError("Driver not found", 404);
      const balance = typeof dSnap.data()?.earningsKobo === "number" ? dSnap.data()!.earningsKobo : 0;
      if (body.amountKobo > balance) throw new HttpError("Insufficient balance", 409);
      tx.update(driverRef, { earningsKobo: FieldValue.increment(-body.amountKobo) });
      tx.set(wRef, {
        id: wRef.id,
        driverId: user.uid,
        amount: body.amountKobo,
        method: body.method,
        status: "pending",
        createdAt: Date.now(),
        ...(body.accountNumber ? { accountNumber: body.accountNumber } : {}),
        ...(body.bankCode ? { bankCode: body.bankCode } : {}),
        ...(body.walletAddress ? { walletAddress: body.walletAddress } : {}),
      });
    });

    return ok({ withdrawalId: wRef.id, status: "pending", amountKobo: body.amountKobo });
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
