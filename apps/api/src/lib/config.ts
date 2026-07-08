/**
 * Lifecycle tunables (PROJECT_PLAN §20). All optional env overrides with sensible
 * campus-scale defaults, read once at load. Keep money in kobo.
 */

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

/** How long a matched-but-unpaid `assigned` ride holds its seat before expiring (§20.1). */
export const PAYMENT_WINDOW_MS = intEnv("PAYMENT_WINDOW_MS", 3 * 60 * 1000);

/** A keke silent longer than this is not matchable — heartbeat (§20.5). */
export const DRIVER_HEARTBEAT_MS = intEnv("DRIVER_HEARTBEAT_MS", 2 * 60 * 1000);

/** Grace after surge flips off during which an opted-in priorityFee is still honored (§20). */
export const SURGE_GRACE_MS = intEnv("SURGE_GRACE_MS", 60 * 1000);

/** Max accepted priorityFee (kobo) — anti-abuse cap (§20.10). */
export const PRIORITY_FEE_CAP_KOBO = intEnv("PRIORITY_FEE_CAP_KOBO", 500_000);
