/**
 * Driver onboarding gate (§20.6). A driver may register only if approved by SUG,
 * via either DRIVER_WHITELIST (comma-separated emails, simplest for the demo) or an
 * SUG-seeded `allowedDrivers` Firestore collection (doc id = uid or email).
 */

import { adminDb } from "./firestore.js";

function whitelistedEmails(): Set<string> {
  const raw = process.env.DRIVER_WHITELIST ?? "";
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

/** True if this user is an SUG-approved driver (env list or allowedDrivers doc). */
export async function isApprovedDriver(uid: string, email?: string): Promise<boolean> {
  if (email && whitelistedEmails().has(email.toLowerCase())) return true;

  const db = adminDb();
  const byUid = await db.collection("allowedDrivers").doc(uid).get();
  if (byUid.exists) return true;
  if (email) {
    const byEmail = await db.collection("allowedDrivers").doc(email.toLowerCase()).get();
    if (byEmail.exists) return true;
  }
  return false;
}
