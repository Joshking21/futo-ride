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

/** Pulls the uid from a "/start <uid>" command, if present. */
function startPayload(text: string | undefined): string | null {
  if (!text) return null;
  const match = text.match(/^\/start(?:\s+(\S+))?/);
  return match?.[1] ?? null;
}

/**
 * Telegram bot webhook — receives the /start handshake and stores the user's
 * chat id so we can send them personal pings (bus proximity, driver dispatch).
 *
 * Auth is the X-Telegram-Bot-Api-Secret-Token header (set via setWebhook), NOT a
 * Firebase token — Telegram is the caller. We only attach a chat id to an EXISTING
 * user doc, so a random uid can't create ghost records.
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
    const uid = startPayload(update?.message?.text);

    // Always 200 to Telegram (it retries on non-2xx); just no-op on a bad update.
    if (typeof chatId !== "number" || !uid) return ok({ ok: true });

    const db = adminDb();
    const userRef = db.collection("users").doc(uid);
    if (!(await userRef.get()).exists) return ok({ ok: true });

    await userRef.set({ chatId }, { merge: true });

    // Mirror onto the driver doc too, if this user is also a driver.
    const driverRef = db.collection("drivers").doc(uid);
    if ((await driverRef.get()).exists) {
      await driverRef.set({ chatId }, { merge: true });
    }

    await sendMessage(chatId, "✅ FUTO-Ride connected. You'll get ride and bus alerts here.").catch(
      () => undefined,
    );
    return ok({ ok: true });
  });
}
