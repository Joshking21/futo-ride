import { randomBytes, randomInt, timingSafeEqual } from "node:crypto";

/** Mints a per-trip QR token. The driver renders it; the rider scans it at dropoff. */
export function mintQrToken(): string {
  return randomBytes(24).toString("base64url");
}

/** Mints a 6-digit numeric completion PIN — the manual fallback to the QR (§20.3). */
export function mintCompletionPin(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/** Constant-time compare of a scanned token / typed PIN against the stored one. */
export function verifyQrToken(stored: string, given: string): boolean {
  if (!stored || !given) return false;
  const a = Buffer.from(stored);
  const b = Buffer.from(given);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
