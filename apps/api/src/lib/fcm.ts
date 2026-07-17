/**
 * Firebase Cloud Messaging client — sends push notifications to riders and drivers.
 * Wraps `firebase-admin/messaging` (already installed via firebase-admin v14).
 *
 * Design:
 *  • FCM tokens are stored per-user in Firestore as `fcmTokens: string[]` on
 *    both `users/{uid}` and `drivers/{uid}` (mirrored on registration).
 *  • A user can have multiple devices — we send to ALL of their tokens.
 *  • Stale tokens (app uninstalled, token rotated) are auto-pruned on the
 *    `messaging/registration-token-not-registered` error from FCM.
 *  • Every public function is best-effort: catches + logs errors, never throws.
 *    A failed push must never fail the caller's action (same pattern as Telegram DMs).
 */

import { getMessaging } from "firebase-admin/messaging";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminApp } from "./firebase-admin.js";
import { adminDb } from "./firestore.js";

export interface PushPayload {
  title: string;
  body: string;
  /** Flat string map delivered as FCM `data` — the app uses this to route/display. */
  data?: Record<string, string>;
}

/** Reads FCM tokens from a Firestore doc, returning an empty array if absent. */
async function getTokens(collection: string, docId: string): Promise<string[]> {
  const snap = await adminDb().collection(collection).doc(docId).get();
  const tokens = snap.data()?.fcmTokens;
  return Array.isArray(tokens) ? tokens.filter((t): t is string => typeof t === "string" && t.length > 0) : [];
}

/**
 * Removes a stale token from both the user and (if exists) driver doc. Called
 * automatically when FCM rejects a token as unregistered — no manual cleanup needed.
 */
async function pruneToken(uid: string, token: string): Promise<void> {
  const db = adminDb();
  const remove = { fcmTokens: FieldValue.arrayRemove(token) };
  await db.collection("users").doc(uid).set(remove, { merge: true }).catch(() => undefined);
  const driverRef = db.collection("drivers").doc(uid);
  if ((await driverRef.get().catch(() => null))?.exists) {
    await driverRef.set(remove, { merge: true }).catch(() => undefined);
  }
}

/** True if the FCM error indicates the token is permanently invalid (uninstalled, rotated). */
function isTokenInvalid(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const code = (err as { code?: string }).code ?? "";
  return (
    code === "messaging/registration-token-not-registered" ||
    code === "messaging/invalid-registration-token"
  );
}

/**
 * Sends a push notification to all devices registered by a user (by uid).
 * Reads tokens from `users/{uid}.fcmTokens`. Auto-prunes invalid tokens.
 * Best-effort — never throws.
 */
export async function sendPush(uid: string, payload: PushPayload): Promise<void> {
  try {
    const tokens = await getTokens("users", uid);
    if (tokens.length === 0) return;

    const messaging = getMessaging(getAdminApp());
    await Promise.all(
      tokens.map(async (token) => {
        try {
          await messaging.send({
            token,
            notification: { title: payload.title, body: payload.body },
            ...(payload.data ? { data: payload.data } : {}),
          });
        } catch (err) {
          if (isTokenInvalid(err)) {
            await pruneToken(uid, token);
          } else {
            console.error("FCM send failed:", err);
          }
        }
      }),
    );
  } catch (err) {
    console.error("FCM sendPush failed:", err);
  }
}

/**
 * Sends a push notification to a driver's devices. Reads tokens from
 * `drivers/{driverId}.fcmTokens`. Auto-prunes invalid tokens.
 * Best-effort — never throws.
 */
export async function sendPushToDriver(driverId: string, payload: PushPayload): Promise<void> {
  try {
    const tokens = await getTokens("drivers", driverId);
    if (tokens.length === 0) return;

    const messaging = getMessaging(getAdminApp());
    await Promise.all(
      tokens.map(async (token) => {
        try {
          await messaging.send({
            token,
            notification: { title: payload.title, body: payload.body },
            ...(payload.data ? { data: payload.data } : {}),
          });
        } catch (err) {
          if (isTokenInvalid(err)) {
            await pruneToken(driverId, token);
          } else {
            console.error("FCM driver send failed:", err);
          }
        }
      }),
    );
  } catch (err) {
    console.error("FCM sendPushToDriver failed:", err);
  }
}
