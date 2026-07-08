/**
 * Live surge evaluation (PROJECT_PLAN §8). A "zone" is a pickup stop id.
 * Surge is evaluated over a rolling 2-minute window with hysteresis; the last
 * state per zone is persisted so the off-threshold can hold between the bands.
 */

import { adminDb } from "./firestore.js";
import { surgeState, type SurgeState } from "./fare.js";
import { DRIVER_HEARTBEAT_MS, SURGE_GRACE_MS } from "./config.js";

const WINDOW_MS = 2 * 60 * 1000;

/** Driver's cut of the priority fee — the rest is the platform service fee (§8). */
export const DRIVER_PRIORITY_SHARE = 0.5;

const DEFAULT_CAPACITY = 4;

export type SurgeEval = {
  state: SurgeState;
  /** Whether a submitted priorityFee should be honored (on, or within grace, §20). */
  honorPriority: boolean;
};

/**
 * Count of available keke SEATS across online kekes seen within the heartbeat
 * window (§6a + §20.5) — pooling means a keke with free seats is still "available"
 * capacity, and a stale keke is not counted.
 */
async function availableKekes(): Promise<number> {
  const snap = await adminDb()
    .collection("drivers")
    .where("online", "==", true)
    .where("vehicleType", "==", "keke")
    .get();

  const cutoff = Date.now() - DRIVER_HEARTBEAT_MS;
  let seats = 0;
  for (const doc of snap.docs) {
    const d = doc.data();
    const lastSeenAt = typeof d.lastSeenAt === "number" ? d.lastSeenAt : 0;
    if (lastSeenAt < cutoff) continue;
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
 * persisted previous state, and stores the new state + last-on timestamp. Returns
 * the current state and whether a priorityFee should be honored (on, or still
 * within the grace window after flipping off — §20).
 */
export async function evaluateSurge(zone: string): Promise<SurgeEval> {
  const db = adminDb();
  const ref = db.collection("surgeState").doc(zone);

  const [pending, kekes, prevSnap] = await Promise.all([
    pendingRequests(zone),
    availableKekes(),
    ref.get(),
  ]);

  const prevData = prevSnap.data() ?? {};
  const prev = (prevData.state as SurgeState) ?? "off";
  const prevLastOnAt = typeof prevData.lastOnAt === "number" ? prevData.lastOnAt : 0;
  const next = surgeState(pending, kekes, prev);
  const now = Date.now();
  const lastOnAt = next === "on" ? now : prevLastOnAt;

  if (next !== prev || next === "on") {
    await ref.set({ state: next, updatedAt: now, lastOnAt }, { merge: true });
  }

  const honorPriority = next === "on" || now - lastOnAt <= SURGE_GRACE_MS;
  return { state: next, honorPriority };
}

/** Driver's bonus (kobo) from a priority fee, given the split. */
export function driverPriorityBonusKobo(priorityFeeKobo: number): number {
  return Math.round(priorityFeeKobo * DRIVER_PRIORITY_SHARE);
}
