/**
 * Driver-facing Telegram pings (driver stays blind to bidding, §12). All are
 * best-effort — a Telegram failure must never fail the caller's action.
 */

import { adminDb } from "./firestore.js";
import { sendTelegramAlert } from "./alerta.js";

async function driverChatId(driverId: string): Promise<string | undefined> {
  const snap = await adminDb().collection("drivers").doc(driverId).get();
  return snap.data()?.chatId as string | undefined;
}

/**
 * Dispatches a new pickup to the driver (§20.7 — now carries the rideId so the
 * driver app can open the trip). Includes the surge bonus when one applies.
 */
export async function dispatchToDriver(params: {
  driverId: string;
  rideId: string;
  fromName: string;
  toName: string;
  driverBonusKobo: number;
}): Promise<void> {
  const chatId = await driverChatId(params.driverId);
  if (!chatId) return;

  const bonusLine =
    params.driverBonusKobo > 0
      ? ` — 🔥 surge bonus +₦${(params.driverBonusKobo / 100).toFixed(2)}`
      : "";
  await sendTelegramAlert(
    {
      title: "📍 New pickup",
      severity: "info",
      message: `Ride ${params.rideId}: ${params.fromName} → ${params.toName}${bonusLine}`,
    },
    chatId,
  );
}

/** A generic best-effort driver ping (rider cancelled, hold expired, etc.). */
export async function pingDriver(driverId: string, title: string, message: string): Promise<void> {
  const chatId = await driverChatId(driverId);
  if (!chatId) return;
  await sendTelegramAlert({ title, severity: "info", message }, chatId);
}
