/**
 * Money helpers. The whole backend stores and exchanges money as integer **kobo**
 * (1 naira = 100 kobo). Convert to/from naira ONLY at the Partna boundary — Partna's
 * ramp `amount`/`fromAmount` for NGN are in naira (verified: docs.getpartna.com/v4).
 */

/** Kobo (integer) → naira for an outbound Partna ramp call. */
export function koboToNaira(kobo: number): number {
  return kobo / 100;
}

/** Naira from a Partna ramp response → integer kobo for internal storage. */
export function nairaToKobo(naira: number): number {
  return Math.round(naira * 100);
}
