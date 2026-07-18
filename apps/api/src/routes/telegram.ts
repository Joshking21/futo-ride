import type { FastifyInstance } from "fastify";
import { adminDb } from "../lib/firestore.js";
import { ok } from "../lib/http.js";
import { sendMessage } from "../lib/telegram.js";

type TelegramUpdate = {
  message?: {
    chat?: { id?: number };
    text?: string;
  };
};

/** Pulls the start parameter (a one-time nonce) from a "/start <nonce>" command. */
function startPayload(text: string | undefined): string | null {
  if (!text) return null;
  const match = text.match(/^\/start(?:\s+(\S+))?/);
  return match?.[1] ?? null;
}

/**
 * Telegram bot webhook — receives the /start handshake and stores the user's chat
 * id so we can send them personal pings (bus proximity, driver dispatch).
 *
 * Auth is the X-Telegram-Bot-Api-Secret-Token header (set via setWebhook), NOT a
 * Firebase token — Telegram is the caller. The /start parameter is a ONE-TIME NONCE
 * (from POST /me/telegram-link), resolved here to the uid (§20.9). A raw uid is NOT
 * accepted — that prevented hijacking a driver's dispatch channel.
 */
export default async function telegramRoutes(app: FastifyInstance) {
  app.post("/telegram/webhook", async (req, reply) => {
    const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
    const provided = req.headers["x-telegram-bot-api-secret-token"];
    if (!expected || provided !== expected) {
      return reply.status(401).send({ ok: false, error: "Unauthorized" });
    }

    const update = req.body as TelegramUpdate;
    const chatId = update?.message?.chat?.id;
    const nonce = startPayload(update?.message?.text);

    // Always 200 to Telegram (it retries on non-2xx); just no-op on a bad update.
    if (typeof chatId !== "number" || !nonce) return ok({ ok: true });

    const db = adminDb();
    const linkRef = db.collection("telegramLinks").doc(nonce);
    const linkSnap = await linkRef.get();
    const link = linkSnap.data() as
      | { uid?: string; expiresAt?: number }
      | undefined;
    if (!link?.uid || (link.expiresAt ?? 0) < Date.now())
      return ok({ ok: true });

    const uid = link.uid;
    await linkRef.delete(); // single-use
    await db.collection("users").doc(uid).set({ chatId }, { merge: true });

    // Mirror onto the driver doc too, if this user is also a driver.
    const driverRef = db.collection("drivers").doc(uid);
    if ((await driverRef.get()).exists) {
      await driverRef.set({ chatId }, { merge: true });
    }

    await sendMessage(
      chatId,
      "✅ FUTO-Ride connected. You'll get ride and bus alerts here.",
    ).catch(() => undefined);
    return ok({ ok: true });
  });
}
