/**
 * PAJ Ramp client — the alternative payment edge to Partna (see lib/partna.ts). Collection
 * uses the **onramp**: the platform's PAJ business account creates an order, the rider pays
 * NGN by bank transfer to the returned virtual account, and PAJ delivers **USDC on Solana**
 * into the treasury wallet; a webhook confirms it. Selected via PAYMENT_PROVIDER=paj.
 *
 * Verified live against production (2026-07-20, see memory/paj-ramp.md):
 *  • Auth = a platform **session token** (Bearer), obtained once via OTP (initiate→verify),
 *    valid ~2 years. We hold ONE platform token (PAJ_SESSION_TOKEN); riders never OTP.
 *  • `createOnrampOrder` returns { id, accountNumber, accountName, bank, fiatAmount,
 *    usdcAmount (net), rate, status } — UX is "display bank details", not a hosted widget.
 *  • Correlation is by PAJ's own order `id` (no client `reference` field).
 *  • `getTransaction(token, id)` = authoritative status re-check (our getRampByReference analogue).
 *  • Webhook auth = header `Authorization: Bearer <PAJ_WEBHOOK_SECRET>` (a shared secret).
 *  • Real webhook statuses are uppercase `PROCESSING` → `COMPLETED`/`ERROR` (NOT the SDK's
 *    documented INIT|PAID|COMPLETED). PROCESSING = fiat received.
 *  • Settlement needs a treasury wallet with an **initialized USDC ATA** + a non-dust amount.
 *
 * Money is naira at this edge; kobo internally (see lib/money.ts).
 */
import { readFileSync, existsSync } from "node:fs";
import { initializeSDK, createOnrampOrder, getTransaction, Environment, Chain } from "paj_ramp";

/** USDC on Solana — what NGN collections settle into. Mainnet USDC mint by default. */
export const PAJ_SETTLE_MINT = process.env.PAJ_USDC_MINT ?? "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

let initialized = false;
function ensureInit() {
  if (initialized) return;
  const env = (process.env.PAJ_ENV ?? "production").toLowerCase();
  initializeSDK(env === "staging" ? Environment.Staging : env === "local" ? Environment.Local : Environment.Production);
  initialized = true;
}

/**
 * The platform's PAJ session token (Bearer). Prefers PAJ_SESSION_TOKEN; falls back to the
 * cached token written by src/scripts/paj-smoke.ts (dev convenience) so the app runs locally
 * without pasting the long token into env. Production should set PAJ_SESSION_TOKEN.
 */
function sessionToken(): string {
  if (process.env.PAJ_SESSION_TOKEN) return process.env.PAJ_SESSION_TOKEN;
  const cache = new URL("../../.paj-session.json", import.meta.url);
  if (existsSync(cache)) {
    try {
      const c = JSON.parse(readFileSync(cache, "utf8")) as { token: string; expiresAt?: string };
      if (c.token && (!c.expiresAt || new Date(c.expiresAt).getTime() > Date.now())) return c.token;
    } catch {
      /* fall through */
    }
  }
  throw new Error("Missing PAJ_SESSION_TOKEN (platform session token) and no valid cached token");
}

export type PajOrder = {
  id: string;
  accountNumber: string;
  accountName: string;
  bank: string;
  fiatAmount: number;
  usdcAmount: number;
  rate: number;
  status: string;
};

/** Create an onramp order: rider pays `amountNaira` to the returned account → USDC to `recipient`. */
export async function createPajOnramp(params: {
  amountNaira: number;
  recipient: string;
  webhookURL: string;
}): Promise<PajOrder> {
  ensureInit();
  const order = await createOnrampOrder(
    {
      fiatAmount: params.amountNaira,
      currency: "NGN",
      recipient: params.recipient,
      mint: PAJ_SETTLE_MINT,
      chain: Chain.SOLANA,
      webhookURL: params.webhookURL,
    },
    sessionToken(),
  );
  return order as unknown as PajOrder;
}

export type PajTransactionStatus = {
  status: string;
  fiatAmountNaira: number;
  usdcAmount: number;
  rate: number;
  signature?: string;
};

/** Authoritative status by PAJ order id (verify + webhook reconciliation). */
export async function getPajTransaction(id: string): Promise<PajTransactionStatus | null> {
  ensureInit();
  const tx = (await getTransaction(sessionToken(), id)) as unknown as {
    status?: string;
    fiatAmount?: number;
    usdcAmount?: number;
    rate?: number;
    signature?: string;
  };
  if (!tx) return null;
  return {
    status: String(tx.status ?? "unknown"),
    fiatAmountNaira: typeof tx.fiatAmount === "number" ? tx.fiatAmount : 0,
    usdcAmount: typeof tx.usdcAmount === "number" ? tx.usdcAmount : 0,
    rate: typeof tx.rate === "number" ? tx.rate : 0,
    signature: tx.signature || undefined,
  };
}

/** True once PAJ has RECEIVED the rider's naira (earlier than full settlement) — the early
 * unlock signal (PROCESSING). Analogous to Partna's isFiatReceived. */
export function isPajFiatReceived(status: string): boolean {
  const s = status.toUpperCase();
  return s === "PROCESSING" || s === "PAID" || s === "COMPLETED";
}

/** True once USDC has actually settled on Solana — the treasury leg. `signature` present is a
 * secondary success signal (the on-chain tx). */
export function isPajSettled(status: string, signature?: string): boolean {
  return status.toUpperCase() === "COMPLETED" || Boolean(signature);
}

/**
 * Verifies a PAJ webhook by the `Authorization: Bearer <secret>` header (PAJ_WEBHOOK_SECRET).
 * Returns false if no secret is configured — set PAJ_WEBHOOK_SECRET to the value configured on
 * the PAJ merchant (the live capture showed the placeholder `merchant-secret-key`).
 */
export function verifyPajWebhook(headers: Record<string, string | string[] | undefined>): boolean {
  const secret = process.env.PAJ_WEBHOOK_SECRET;
  if (!secret) return false;
  const raw = headers["authorization"] ?? headers["Authorization"];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === `Bearer ${secret}`;
}
