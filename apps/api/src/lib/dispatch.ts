/**
 * Driver-facing Telegram pings + FCM push (driver stays blind to bidding, §12). All are
 * best-effort — a Telegram or FCM failure must never fail the caller's action.
 *
 * Telegram DMs go through OUR OWN bot (native sendMessage): the driver did the
 * `/start` handshake with our bot (TELEGRAM_BOT_TOKEN). Alerta is reserved for
 * the SUG Security GROUP alerts.
 *
 * FCM pushes go through `sendPushToDriver` — reads `drivers/{uid}.fcmTokens`,
 * auto-prunes stale tokens. Runs alongside Telegram (both best-effort, in parallel).
 */

import { adminDb } from "./firestore.js";
import { sendMessage } from "./telegram.js";
import { sendPushToDriver } from "./fcm.js";

async function driverChatId(driverId: string): Promise<string | undefined> {
  const snap = await adminDb().collection("drivers").doc(driverId).get();
  return snap.data()?.chatId as string | undefined;
}

/**
 * Dispatches a new pickup to the driver (§20.7 — carries the rideId so the driver app
 * can open the trip). Includes the surge bonus when one applies.
 * Fires both Telegram DM and FCM push in parallel (best-effort).
 */
export async function dispatchToDriver(params: {
  driverId: string;
  rideId: string;
  fromName: string;
  toName: string;
  driverBonusKobo: number;
}): Promise<void> {
  const bonusLine =
    params.driverBonusKobo > 0
      ? ` — 🔥 surge bonus +₦${(params.driverBonusKobo / 100).toFixed(2)}`
      : "";
  const title = "📍 New pickup";
  const body = `Ride ${params.rideId}: ${params.fromName} → ${params.toName}${bonusLine}`;

  // Fire both channels in parallel — each is independent and best-effort.
  const telegramPromise = (async () => {
    const chatId = await driverChatId(params.driverId);
    if (chatId) await sendMessage(chatId, `${title}\n${body}`);
  })().catch(() => undefined);

  const fcmPromise = sendPushToDriver(params.driverId, {
    title,
    body,
    data: { type: "dispatch", rideId: params.rideId },
  });

  await Promise.all([telegramPromise, fcmPromise]);
}

/**
 * A generic best-effort driver ping (rider cancelled, hold expired, etc.).
 * Fires both Telegram DM and FCM push in parallel.
 */
export async function pingDriver(
  driverId: string,
  title: string,
  message: string,
  data?: Record<string, string>,
): Promise<void> {
  const telegramPromise = (async () => {
    const chatId = await driverChatId(driverId);
    if (chatId) await sendMessage(chatId, `${title}\n${message}`);
  })().catch(() => undefined);

  const fcmPromise = sendPushToDriver(driverId, {
    title,
    body: message,
    data: { type: "driver_ping", ...(data ?? {}) },
  });

  await Promise.all([telegramPromise, fcmPromise]);
}

