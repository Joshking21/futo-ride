import { randomBytes, timingSafeEqual } from "node:crypto";

/** Mints a per-trip QR token. The driver renders it; the rider scans it at dropoff. */
export function mintQrToken(): string {
  return randomBytes(24).toString("base64url");
}

/** Constant-time compare of a scanned token against the stored one. */
export function verifyQrToken(stored: string, given: string): boolean {
  const a = Buffer.from(stored);
  const b = Buffer.from(given);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
