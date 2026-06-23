import type { Severity } from "../types/index.js";

const BASE_URL = "https://api.alerta.encrisoft.com/v2";

export interface AlertPayload {
  title: string;
  severity: Severity;
  message: string;
  meta?: Record<string, unknown>;
}

/** Sends an incident alert to SUG Security Telegram via Alerta. */
export async function sendTelegramAlert(payload: AlertPayload): Promise<void> {
  const apiKey = process.env.ALERTA_API_KEY;
  const apiSecret = process.env.ALERTA_API_SECRET;
  const target = process.env.ALERTA_TELEGRAM_TARGET;
  if (!apiKey || !apiSecret || !target) {
    throw new Error("Missing Alerta credentials");
  }

  const res = await fetch(`${BASE_URL}/telegram/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "x-api-secret": apiSecret,
    },
    body: JSON.stringify({ ...payload, target }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "unknown");
    console.error(`Alerta send failed (${res.status}): ${text}`);
    throw new Error(`Alerta API error: ${res.status}`);
  }
}
