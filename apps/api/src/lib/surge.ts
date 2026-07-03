/**
 * Live surge evaluation (PROJECT_PLAN §8). A "zone" is a pickup stop id.
 * Surge is evaluated over a rolling 2-minute window with hysteresis; the last
 * state per zone is persisted so the off-threshold can hold between the bands.
 */

import { adminDb } from "./firestore.js";
import { surgeState, type SurgeState } from "./fare.js";

const WINDOW_MS = 2 * 60 * 1000;

/** Driver's cut of the priority fee — the rest is the platform service fee (§8). */
export const DRIVER_PRIORITY_SHARE = 0.5;

const DEFAULT_CAPACITY = 4;

/**
 * Count of available keke SEATS across online kekes (§6a) — pooling means a keke
 * with free seats is still "available" capacity, so surge compares demand against
 * open seats, not vehicle count.
 */
async function availableKekes(): Promise<number> {
  const snap = await adminDb()
    .collection("drivers")
    .where("online", "==", true)
    .where("vehicleType", "==", "keke")
    .get();

  let seats = 0;
  for (const doc of snap.docs) {
    const d = doc.data();
    const capacity = typeof d.capacity === "number" ? d.capacity : DEFAULT_CAPACITY;
    const seatsTaken = typeof d.seatsTaken === "number" ? d.seatsTaken : 0;
    seats += Math.max(0, capacity - seatsTaken);
  }
  return seats;
}

/** Pending ride requests from this zone within the rolling window. */
async function pendingRequests(zone: string): Promise<number> {
  const since = Date.now() - WINDOW_MS;
  const snap = await adminDb()
    .collection("rides")
    .where("fromStop", "==", zone)
    .where("status", "in", ["requested", "assigned"])
    .where("createdAt", ">=", since)
    .get();
  return snap.size;
}

/**
 * Evaluates surge for a zone against live counts, applying hysteresis from the
 * persisted previous state, and stores the new state. Returns the current state.
 */
export async function evaluateSurge(zone: string): Promise<SurgeState> {
  const db = adminDb();
  const ref = db.collection("surgeState").doc(zone);

  const [pending, kekes, prevSnap] = await Promise.all([
    pendingRequests(zone),
    availableKekes(),
    ref.get(),
  ]);

  const prev = (prevSnap.data()?.state as SurgeState) ?? "off";
  const next = surgeState(pending, kekes, prev);

  if (next !== prev) {
    await ref.set({ state: next, updatedAt: Date.now() }, { merge: true });
  }
  return next;
}

/** Driver's bonus (kobo) from a priority fee, given the split. */
export function driverPriorityBonusKobo(priorityFeeKobo: number): number {
  return Math.round(priorityFeeKobo * DRIVER_PRIORITY_SHARE);
}

/** Read-only current surge state for a zone (for the rider's priority button). */
export async function readSurge(zone: string): Promise<SurgeState> {
  const snap = await adminDb().collection("surgeState").doc(zone).get();
  return (snap.data()?.state as SurgeState) ?? "off";
}
