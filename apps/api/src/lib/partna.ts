/**
 * Partna V4 client — the payment edge (§21). Collection uses the **onramp**: the rider
 * pays NGN by bank transfer and Partna delivers **USDC on Solana** into the platform
 * treasury wallet; a webhook confirms it. Driver payout (future) uses the **offramp**.
 *
 * Verified against docs.getpartna.com/v4 on 2026-07-08:
 *  • Auth = headers `x-api-key` + `x-api-user` (no request signing).
 *  • Base: staging https://staging-api.getpartna.com/v4 · prod https://api.getpartna.com/v4.
 *  • Hosted onramp widget: <pay-host>/v4/pay/onramp?amount&from_currency&to_currency&to_network&address&merchant&reference.
 *  • Ramp: POST /ramp (type fiatToCrypto|cryptoToFiat); status: GET /ramp?rampReference=.
 *  • Webhooks: { event, data, signature }; signature = RSA-PSS/SHA-256 over JSON(data),
 *    verified with Partna's env-specific PUBLIC key. (Different from Monnify's HMAC.)
 *  • Staging mocks: POST /mock/fiat-deposit { amount, currency } drives the real webhook.
 *  • cNGN is NOT supported by Partna → we settle in USDC-on-Solana.
 *
 * Money is naira at this edge; kobo internally (see lib/money.ts).
 */

import { createVerify, constants } from "node:crypto";

/** USDC on Solana — what NGN collections settle into (cNGN is unsupported). */
export const SETTLE_CURRENCY = "USDC";
export const SETTLE_NETWORK = "solana";

function cfg() {
  const apiKey = process.env.PARTNA_API_KEY;
  const apiUser = process.env.PARTNA_API_USER;
  const baseUrl = process.env.PARTNA_BASE_URL ?? "https://staging-api.getpartna.com/v4";
  if (!apiKey || !apiUser) throw new Error("Missing Partna credentials");
  return { apiKey, apiUser, baseUrl };
}

async function partnaFetch(path: string, init?: RequestInit): Promise<Record<string, unknown>> {
  const { apiKey, apiUser, baseUrl } = cfg();
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "x-api-user": apiUser, ...(init?.headers ?? {}) },
  });
  const text = await res.text().catch(() => "");
  if (!res.ok) throw new Error(`Partna ${path} failed: ${res.status} ${text}`);
  return text ? (JSON.parse(text) as Record<string, unknown>) : {};
}

/**
 * Builds the hosted onramp checkout URL (the analogue of a Monnify checkoutUrl). The
 * widget owns rate lock, KYC, and the virtual-account UI; we only correlate by `reference`.
 */
export function buildOnrampCheckoutUrl(params: { amountNaira: number; reference: string }): string {
  const { apiUser } = cfg();
  const payUrl = process.env.PARTNA_PAY_URL ?? "https://staging-pay.getpartna.com";
  const treasury = process.env.TREASURY_SOLANA_ADDRESS;
  if (!treasury) throw new Error("Missing TREASURY_SOLANA_ADDRESS");
  const q = new URLSearchParams({
    amount: String(params.amountNaira),
    from_currency: "NGN",
    to_currency: SETTLE_CURRENCY,
    to_network: SETTLE_NETWORK,
    address: treasury,
    merchant: apiUser,
    reference: params.reference,
  });
  return `${payUrl}/v4/pay/onramp?${q.toString()}`;
}

/** Ramp request status by our reference (verify fallback + reconciliation). */
export async function getRampByReference(
  reference: string,
): Promise<{ status: string; confirmed: boolean; fromAmountNaira: number } | null> {
  const json = await partnaFetch(`/ramp?rampReference=${encodeURIComponent(reference)}`, { method: "GET" });
  const data = (json.data ?? {}) as { rampRequests?: Array<Record<string, unknown>> };
  const reqs = data.rampRequests ?? [];
  const match = reqs.find((r) => r.rampReference === reference) ?? reqs[0];
  if (!match) return null;
  return {
    status: String(match.status ?? "pending"),
    confirmed: match.confirmed === true,
    fromAmountNaira: typeof match.fromAmount === "number" ? match.fromAmount : 0,
  };
}

/** Staging-only: simulate the rider's NGN bank transfer so the real webhook fires (demo). */
export async function mockFiatDeposit(amountNaira: number): Promise<void> {
  await partnaFetch(`/mock/fiat-deposit`, {
    method: "POST",
    body: JSON.stringify({ amount: amountNaira, currency: "NGN" }),
  });
}

export type PartnaWebhook = { event?: string; data?: Record<string, unknown>; signature?: string };

/**
 * Verifies a Partna webhook: RSA-PSS + SHA-256 over the JSON-encoded `data` field,
 * checked against PARTNA_WEBHOOK_PUBLIC_KEY (env-specific PEM). Signature encoding is
 * assumed base64 — CONFIRM against Partna's Node sample when live keys arrive (AGENTS §4).
 */
export function verifyPartnaWebhook(body: PartnaWebhook): boolean {
  const pem = process.env.PARTNA_WEBHOOK_PUBLIC_KEY;
  if (!pem || !body?.signature || !body?.data) return false;
  try {
    const verifier = createVerify("sha256");
    verifier.update(JSON.stringify(body.data));
    verifier.end();
    return verifier.verify(
      {
        key: pem.replace(/\\n/g, "\n"),
        padding: constants.RSA_PKCS1_PSS_PADDING,
        saltLength: constants.RSA_PSS_SALTLEN_DIGEST,
      },
      body.signature,
      "base64",
    );
  } catch {
    return false;
  }
}

/** True once the onramp has fully settled (crypto delivered). Statuses: pending →
 * received → processing → completed. Only `completed` funds the treasury (§21). */
export function isOnrampSettled(status: string): boolean {
  return status.toLowerCase() === "completed";
}

/**
 * True once Partna has RECEIVED the customer's naira (the fiat leg) — which is EARLIER than
 * full USDC settlement (`completed`). Gating the ride unlock on THIS instead of `completed`
 * is what stops the rider waiting on the on-chain conversion (§21).
 *
 * Safe default: unlock on the `Deposit` webhook event, on `confirmed`, or once `completed`.
 * We deliberately do NOT unlock on a bare `processing`/`received` status yet — see the TODO.
 *
 * TODO(partna-verify): Partna's public docs don't spell out the exact fiat-received signal.
 * Confirm on staging (fire POST /payments/mock-deposit, read the logged webhook in
 * /payments/webhook):
 *   1. Does the `Deposit` event fire first, and does its payload carry `rampReference`?
 *   2. What are `status`/`confirmed` at that moment, and is a received deposit ever reversible?
 * If `status: "processing"` (or "received") reliably means naira-in-and-non-reversible, add it
 * below to unlock a touch earlier. If a deposit CAN reverse, leave this as-is and keep the
 * treasury credit on `completed` only (it already is) — an early ride unlock is the only
 * exposure, and money never lands = no over-credit.
 */
export function isFiatReceived(status: string, confirmed: boolean, event?: string): boolean {
  if (event?.toLowerCase() === "deposit") return true;
  if (confirmed === true) return true;
  const s = status.toLowerCase();
  return s === "completed"; // TODO(partna-verify): consider adding "processing"/"received" here
}
