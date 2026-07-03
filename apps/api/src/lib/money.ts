/**
 * Money helpers. The whole backend stores and exchanges money as integer **kobo**
 * (1 naira = 100 kobo). Convert to/from naira ONLY at the Monnify boundary, since
 * Monnify's `amount` field is in naira (verified: developers.monnify.com).
 */

/** Kobo (integer) → naira for an outbound Monnify call. */
export function koboToNaira(kobo: number): number {
  return kobo / 100;
}

/** Naira from a Monnify response → integer kobo for internal storage. */
export function nairaToKobo(naira: number): number {
  return Math.round(naira * 100);
}
