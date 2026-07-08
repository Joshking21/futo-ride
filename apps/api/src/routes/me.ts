import type { FastifyInstance } from "fastify";
import { randomBytes } from "node:crypto";
import { verifyRequest } from "../lib/auth.js";
import { adminDb } from "../lib/firestore.js";
import { ok } from "../lib/http.js";
import { getBotUsername } from "../lib/telegram.js";
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
}
