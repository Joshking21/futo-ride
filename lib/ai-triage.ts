/**
 * AI incident triage — sits between an event and Alerta (PROJECT_PLAN §11). 🤖
 * Backend only; reads LLM_API_KEY.
 *
 * One LLM call: incident context → severity + summary + action + false-alarm
 * filter. Flow: event → triage → Alerta → Telegram.
 *
 * TODO: implement against the chosen provider's current SDK (AGENTS §5).
 */

export {};
