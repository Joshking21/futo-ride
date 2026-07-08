/**
 * Fare + surge logic for keke rides. All amounts are integer **kobo** (see lib/money.ts).
 * Constants are tunable; surge implements PROJECT_PLAN §8.
 */

const BOARDING_FEE_KOBO = 10_000; // ₦100 flat to board
const PER_KM_KOBO = 15_000; // ₦150 per km

/** Flat fare per seat for a pooled keke ride (distance-independent) — ₦150/seat. */
export const SEAT_FARE_KOBO = 15_000;

export type SurgeState = "on" | "off";

/**
 * Distance-based fare for a private (non-pooled) keke trip. Retained for
 * reference / the charter case; pooled rides use `seatFareKobo` instead.
 */
export function baseFareKobo(distKm: number): number {
  return Math.round(BOARDING_FEE_KOBO + PER_KM_KOBO * distKm);
}

/** Flat per-seat fare: each seat costs SEAT_FARE_KOBO (§6a). 4 seats = charter. */
export function seatFareKobo(seats: number): number {
  return SEAT_FARE_KOBO * seats;
}

/** Platform's cut of a seat fare (kobo), given the fee in basis points (§21/P2). */
export function platformCutKobo(seatFareKoboAmount: number, feeBps: number): number {
  return Math.round((seatFareKoboAmount * feeBps) / 10_000);
}

/** Driver's share of a seat fare after the platform cut (kobo) (§21/P2). */
export function driverSeatShareKobo(seatFareKoboAmount: number, feeBps: number): number {
  return seatFareKoboAmount - platformCutKobo(seatFareKoboAmount, feeBps);
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
