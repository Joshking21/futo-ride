/**
 * Lifecycle tunables (PROJECT_PLAN §20). All optional env overrides with sensible
 * campus-scale defaults, read once at load. Keep money in kobo.
 */

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

/**
 * How long a matched-but-unpaid `assigned` ride holds its seat before expiring (§20.1).
 * Default 10 min: a Partna onramp settles on a customer-initiated bank transfer, which is
 * slower than a card checkout — the 3-min card-era window was too tight (§21).
 */
export const PAYMENT_WINDOW_MS = intEnv("PAYMENT_WINDOW_MS", 10 * 60 * 1000);

/** A keke silent longer than this is not matchable — heartbeat (§20.5). */
export const DRIVER_HEARTBEAT_MS = intEnv("DRIVER_HEARTBEAT_MS", 2 * 60 * 1000);

/** Grace after surge flips off during which an opted-in priorityFee is still honored (§20). */
export const SURGE_GRACE_MS = intEnv("SURGE_GRACE_MS", 60 * 1000);

/** Max accepted priorityFee (kobo) — anti-abuse cap (§20.10). */
export const PRIORITY_FEE_CAP_KOBO = intEnv("PRIORITY_FEE_CAP_KOBO", 500_000);

/** Platform cut of the seat fare, in basis points (500 = 5%). Driver keeps the rest (§21/P2). */
export const PLATFORM_FEE_BPS = intEnv("PLATFORM_FEE_BPS", 500);

/**
 * Fee (kobo) charged to a rider who cancels AFTER the driver is en route (`arriving`) —
 * credited to the driver as fuel/time compensation; the rest is refunded (H4 policy §21).
 */
export const CANCELLATION_FEE_KOBO = intEnv("CANCELLATION_FEE_KOBO", 5_000);
