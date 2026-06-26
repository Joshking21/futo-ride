/**
 * Native Telegram Bot API client — used to CAPTURE per-user chat ids (the
 * /start handshake) and to send personal pings. This is separate from Alerta:
 * Alerta relays incident alerts to the SUG Security group; this bot handles the
 * inbound /start that lets us learn a rider's/driver's own chat id.
 */

function botToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("Missing TELEGRAM_BOT_TOKEN");
  return token;
}

function apiUrl(method: string): string {
  return `https://api.telegram.org/bot${botToken()}/${method}`;
}

/** Sends a plain-text message to a chat. */
export async function sendMessage(chatId: number | string, text: string): Promise<void> {
  const res = await fetch(apiUrl("sendMessage"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "unknown");
    throw new Error(`Telegram sendMessage failed (${res.status}): ${detail}`);
  }
}

/**
 * Registers the webhook URL with Telegram and sets the secret token Telegram
 * echoes back in the X-Telegram-Bot-Api-Secret-Token header on every call.
 * Run once (e.g. a setup script) after deploying.
 */
export async function setWebhook(url: string, secretToken: string): Promise<void> {
  const res = await fetch(apiUrl("setWebhook"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, secret_token: secretToken }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "unknown");
    throw new Error(`Telegram setWebhook failed (${res.status}): ${detail}`);
  }
}
