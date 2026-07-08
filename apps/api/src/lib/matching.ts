/**
 * Seat-aware keke matching + seat/lifecycle bookkeeping (§6a, §20). Shared by the
 * booking route and the driver-cancel re-match path so the logic lives in one place.
 */

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "./firestore.js";
import { findNearest } from "./geo.js";
import { DRIVER_HEARTBEAT_MS } from "./config.js";
import { pingDriver } from "./dispatch.js";
import type { Ride } from "../types/index.js";

export const DEFAULT_CAPACITY = 4;

export type Stop = { id: string; name: string; lat: number; lng: number };

/** An online keke with its live seat state, for pooling (§6a). */
export type OnlineKeke = {
  id: string;
  lat: number;
  lng: number;
  capacity: number;
  seatsTaken: number;
  poolFromStop?: string;
  poolToStop?: string;
  poolStarted?: boolean;
};

export type MatchedKeke = OnlineKeke & { distKm: number; etaMin: number; joining: boolean };

/**
 * Online kekes with seat state, filtered to those seen within the heartbeat window
 * (§20.5 — a keke silent > DRIVER_HEARTBEAT_MS is treated as gone, not matchable).
 */
export async function onlineKekes(): Promise<OnlineKeke[]> {
  const snap = await adminDb()
    .collection("drivers")
    .where("online", "==", true)
    .where("vehicleType", "==", "keke")
    .get();

  const cutoff = Date.now() - DRIVER_HEARTBEAT_MS;
  const kekes: OnlineKeke[] = [];
  for (const doc of snap.docs) {
    const d = doc.data();
    const lastSeenAt = typeof d.lastSeenAt === "number" ? d.lastSeenAt : 0;
    if (lastSeenAt < cutoff) continue; // stale — skip (ghost keke)
    if (typeof d.currentLat === "number" && typeof d.currentLng === "number") {
      kekes.push({
        id: doc.id,
        lat: d.currentLat,
        lng: d.currentLng,
        capacity: typeof d.capacity === "number" ? d.capacity : DEFAULT_CAPACITY,
        seatsTaken: typeof d.seatsTaken === "number" ? d.seatsTaken : 0,
        poolFromStop: d.poolFromStop as string | undefined,
        poolToStop: d.poolToStop as string | undefined,
        poolStarted: d.poolStarted === true,
      });
    }
  }
  return kekes;
}

/**
 * Seat-aware matcher (§6a). Prefers JOINING an existing pool on the SAME lane —
 * same pickup (`from`) AND same destination (`toStop`) — with room and not yet
 * started (§20.10); otherwise opens a NEW pool on the nearest fully-free keke.
 * Pooling on both stops keeps a keke a single "fromStop → toStop" trip (no zigzag
 * pickup run). `excludeDriverId` skips a keke (used on driver-cancel re-match).
 */
export function matchKeke(
  from: Stop,
  toStop: string,
  seats: number,
  kekes: OnlineKeke[],
  excludeDriverId?: string,
): MatchedKeke | null {
  const pool = excludeDriverId ? kekes.filter((k) => k.id !== excludeDriverId) : kekes;
  const freeSeats = (k: OnlineKeke) => k.capacity - k.seatsTaken;

  // 1) Existing pools on the same lane (from + to) with room, not yet started — nearest wins.
  const joinable = pool.filter(
    (k) =>
      k.seatsTaken > 0 &&
      k.poolFromStop === from.id &&
      k.poolToStop === toStop &&
      !k.poolStarted &&
      freeSeats(k) >= seats,
  );
  const join = findNearest(from, joinable);
  if (join) return { ...join, joining: true };

  // 2) Otherwise a fully-free keke that can seat the party — nearest wins.
  const idle = pool.filter((k) => k.seatsTaken === 0 && freeSeats(k) >= seats);
  const fresh = findNearest(from, idle);
  if (fresh) return { ...fresh, joining: false };

  return null;
}

/**
 * Releases a ride's seats back to its keke when the ride ends (complete/cancel/
 * expire/re-match). Decrements `seatsTaken` transactionally, flooring at 0, and
 * clears `poolToStop` + `poolStarted` once the keke is empty. No-op with no driver.
 */
export async function freeSeats(ride: Pick<Ride, "driverId" | "seats">): Promise<void> {
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
      ...(next === 0
        ? {
            poolFromStop: FieldValue.delete(),
            poolToStop: FieldValue.delete(),
            poolStarted: FieldValue.delete(),
          }
        : {}),
    });
  });
}

/**
 * Lazily expires unpaid `assigned` holds whose window has lapsed (§20.1): marks
 * them `expired`, frees their seats, and pings the driver. No cron — call this on
 * the booking path so lapsed seats free up before matching. Best-effort per ride.
 */
export async function sweepExpiredRides(): Promise<number> {
  const db = adminDb();
  const now = Date.now();
  // Query on the equality field only (auto-indexed); filter the deadline in memory
  // so no composite index is required. Active `assigned` holds are few at campus scale.
  const snap = await db.collection("rides").where("status", "==", "assigned").get();

  let swept = 0;
  for (const doc of snap.docs) {
    const ride = doc.data() as Ride;
    if ((ride.expiresAt ?? Infinity) > now) continue; // hold still valid
    if (ride.paymentStatus === "PAID") continue; // paid rides never expire
    await doc.ref.update({ status: "expired", cancelledBy: "system", cancelReason: "payment_timeout" });
    await freeSeats(ride);
    if (ride.driverId) {
      await pingDriver(
        ride.driverId,
        "⌛ Pickup cancelled",
        `Ride ${ride.id} lapsed (rider didn't pay in time). Seat freed.`,
      ).catch(() => undefined);
    }
    swept++;
  }
  return swept;
}
