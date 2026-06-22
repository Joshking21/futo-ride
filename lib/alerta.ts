/**
 * Alerta (Encrisoft) client — incident-comms to SUG Security via Telegram. 🏆
 * Backend only; reads ALERTA_* secrets.
 *
 * ⚠️ HIGH staleness risk (AGENTS §5). Believed: base
 * https://api.alerta.encrisoft.com/v2, headers x-api-key + x-api-secret,
 * send via POST /v2/telegram/send. VERIFY against docs.encrisoft.com first.
 */

export {};
