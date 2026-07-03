/**
 * Fare + surge logic for keke rides. All amounts are integer **kobo** (see lib/money.ts).
 * Constants are tunable; surge implements PROJECT_PLAN §8.
 */

const BOARDING_FEE_KOBO = 10_000; // ₦100 flat to board
const PER_KM_KOBO = 15_000; // ₦150 per km

export type SurgeState = "on" | "off";

/** Base fare for a trip of `distKm`, rounded to whole kobo. */
export function baseFareKobo(distKm: number): number {
  return Math.round(BOARDING_FEE_KOBO + PER_KM_KOBO * distKm);
}

/**
 * Surge state for a zone over a rolling 2-minute window (PROJECT_PLAN §8):
 * ON when pending ≥ 3 AND pending > kekes × 1.5; OFF at pending ≤ kekes × 1.2 (hysteresis).
 * `prev` carries the last state so hysteresis can hold between the thresholds.
 */
export function surgeState(
  pendingRequests: number,
  availableKekes: number,
  prev: SurgeState = "off",
): SurgeState {
  if (pendingRequests >= 3 && pendingRequests > availableKekes * 1.5) return "on";
  if (pendingRequests <= availableKekes * 1.2) return "off";
  return prev;
}
