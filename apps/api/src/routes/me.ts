import type { FastifyInstance } from "fastify";
import { randomBytes } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { verifyRequest } from "../lib/auth.js";
import { adminDb } from "../lib/firestore.js";
import { ok } from "../lib/http.js";
import { getBotUsername } from "../lib/telegram.js";
import { FcmToken } from "../schemas/fcm.js";
import type { TelegramLink } from "../types/index.js";

const LINK_TTL_MS = 10 * 60 * 1000;

/** Per-user actions keyed off the caller's token. */
export default async function meRoutes(app: FastifyInstance) {
  // Mints a one-time nonce for the Telegram /start handshake (§20.9) — the deep
  // link carries the nonce, never the raw uid (which leaks and could be hijacked).
  app.post("/me/telegram-link", async (req) => {
    const user = await verifyRequest(req);

    const nonce = randomBytes(16).toString("base64url");
    const expiresAt = Date.now() + LINK_TTL_MS;
    const link: TelegramLink = { nonce, uid: user.uid, expiresAt };
    await adminDb().collection("telegramLinks").doc(nonce).set(link);

    const username = await getBotUsername();
    return ok({ url: `https://t.me/${username}?start=${nonce}`, nonce, expiresAt });
  });

  /**
   * Registers an FCM device token for push notifications. Stored as an array
   * on `users/{uid}.fcmTokens` (multi-device support). Also mirrored onto the
   * driver doc if the caller is a registered driver, so `sendPushToDriver()`
   * can read tokens without a cross-collection join.
   *
   * Idempotent: calling with a token that already exists is a no-op.
   */
  app.post("/me/fcm-token", async (req) => {
    const user = await verifyRequest(req);
    const { token } = FcmToken.parse(req.body);

    const db = adminDb();
    const addToken = { fcmTokens: FieldValue.arrayUnion(token) };
    await db.collection("users").doc(user.uid).set(addToken, { merge: true });

    // Mirror to driver doc if this user is also a driver.
    const driverRef = db.collection("drivers").doc(user.uid);
    if ((await driverRef.get()).exists) {
      await driverRef.set(addToken, { merge: true });
    }

    return ok({ registered: true });
  });

  /**
   * Removes an FCM device token (logout, app uninstall, token rotation).
   * Removes from both user and driver docs. Idempotent: removing a token
   * that doesn't exist is a no-op.
   */
  app.delete("/me/fcm-token", async (req) => {
    const user = await verifyRequest(req);
    const { token } = FcmToken.parse(req.body);

    const db = adminDb();
    const removeToken = { fcmTokens: FieldValue.arrayRemove(token) };
    await db.collection("users").doc(user.uid).set(removeToken, { merge: true });

    const driverRef = db.collection("drivers").doc(user.uid);
    if ((await driverRef.get()).exists) {
      await driverRef.set(removeToken, { merge: true });
    }

    return ok({ removed: true });
  });
}
