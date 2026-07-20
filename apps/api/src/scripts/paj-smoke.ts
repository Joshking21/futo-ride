/**
 * PAJ Ramp onramp smoke test (staging) — verifies our credentials + the real onramp flow
 * end-to-end WITHOUT touching the main app. Auth is OTP-based, so this runs in TWO PHASES:
 *
 *   Phase 1 — no PAJ_OTP set:  initiate() → PAJ emails/SMSes an OTP to PAJ_RECIPIENT.
 *   Phase 2 — PAJ_OTP set:     verify() → session token → rates → createOnrampOrder(),
 *                              which returns the bank account to pay into.
 *
 * Run from apps/api (loads the repo-root env):
 *   Phase 1:  pnpm exec tsx --env-file=../../.env.local src/scripts/paj-smoke.ts
 *   ...check your email for the OTP...
 *   Phase 2:  PAJ_OTP=123456 pnpm exec tsx --env-file=../../.env.local src/scripts/paj-smoke.ts
 *
 * Required env (add to .env.local):
 *   PAJ_API_KEY      your PAJ business key (x-api-key)
 *   PAJ_RECIPIENT    the email (or phone) that receives the OTP
 *   PAJ_WALLET       Solana address to receive USDC (defaults to TREASURY_SOLANA_ADDRESS)
 * Optional:
 *   PAJ_ENV          staging | production | local   (default staging)
 *   PAJ_MINT         token mint (default mainnet USDC EPjF…Dt1v)
 *   PAJ_FIAT_AMOUNT  NGN to onramp (default 1000)
 *   PAJ_WEBHOOK_URL  webhook to register on the order (default a placeholder)
 *   PAJ_OTP          phase-2 trigger: the code from the email
 */
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { Keypair } from "@solana/web3.js";
import {
  initializeSDK,
  initiate,
  verify,
  getAllRate,
  createOnrampOrder,
  Environment,
  Chain,
} from "paj_ramp";

const MAINNET_USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
// Where we cache the long-lived session token (valid ~2yrs) so we don't burn an OTP each run.
const TOKEN_CACHE = new URL("../../.paj-session.json", import.meta.url);

/** Resolve the recipient Solana address: explicit env → treasury → derived from the vault key. */
function resolveWallet(): string | undefined {
  if (process.env.PAJ_WALLET) return process.env.PAJ_WALLET;
  if (process.env.TREASURY_SOLANA_ADDRESS) return process.env.TREASURY_SOLANA_ADDRESS;
  const secret = process.env.VAULT_AUTHORITY_SECRET_KEY;
  if (secret) {
    try {
      return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(secret))).publicKey.toBase58();
    } catch {
      /* fall through */
    }
  }
  return undefined;
}

/** Load a cached, non-expired session token if we have one (skips the OTP dance entirely). */
function loadCachedToken(): string | undefined {
  if (process.env.PAJ_SESSION_TOKEN) return process.env.PAJ_SESSION_TOKEN;
  if (!existsSync(TOKEN_CACHE)) return undefined;
  try {
    const c = JSON.parse(readFileSync(TOKEN_CACHE, "utf8")) as { token: string; expiresAt?: string };
    if (c.expiresAt && new Date(c.expiresAt).getTime() < Date.now()) return undefined;
    return c.token;
  } catch {
    return undefined;
  }
}

function envOrThrow(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name} — add it to .env.local`);
  return v;
}

function pickEnvironment(): Environment {
  switch ((process.env.PAJ_ENV ?? "staging").toLowerCase()) {
    case "production":
      return Environment.Production;
    case "local":
      return Environment.Local;
    default:
      return Environment.Staging;
  }
}

async function main() {
  const apiKey = envOrThrow("PAJ_API_KEY");
  const recipient = envOrThrow("PAJ_RECIPIENT");
  const wallet = resolveWallet();
  const otp = process.env.PAJ_OTP;

  const env = pickEnvironment();
  initializeSDK(env);
  console.log(`\n=== PAJ smoke test — env=${process.env.PAJ_ENV ?? "staging"} recipient=${recipient} ===`);

  // Fast path: a cached (or env-supplied) session token means no OTP needed at all.
  let token = loadCachedToken();

  if (token) {
    console.log("[auth] reusing cached session token (skipping OTP).");
  } else if (!otp) {
    // ---- Phase 1: no token, no OTP yet → trigger one ----
    console.log("\n[phase 1] initiate() → requesting OTP …");
    const res = await initiate(recipient, apiKey);
    console.log("[phase 1] OK — PAJ acknowledged:", res);
    console.log(
      "\nNext: check your email/SMS for the OTP, then run phase 2:\n" +
        "  PAJ_OTP=<code> pnpm exec tsx --env-file=../../.env.local src/scripts/paj-smoke.ts\n",
    );
    return;
  } else {
    // ---- Phase 2: OTP present → verify → cache the long-lived token ----
    console.log("\n[phase 2] verify() → exchanging OTP for a session token …");
    const device = { uuid: `futoride-smoke-${Date.now()}`, device: "server" };
    const session = await verify(recipient, otp, device, apiKey);
    const expiresAt = (session as { expiresAt?: string }).expiresAt;
    token = (session as { token: string }).token;
    if (!token) throw new Error("verify() returned no token — cannot continue");
    writeFileSync(TOKEN_CACHE, JSON.stringify({ token, expiresAt }, null, 2));
    console.log(`[phase 2] verify OK. token expiresAt: ${expiresAt} — cached to .paj-session.json`);
  }

  console.log("\n[rates] getAllRate() …");
  const rates = await getAllRate();
  console.log("[rates]:", JSON.stringify(rates, null, 2));

  if (!wallet) {
    console.log("\n(no recipient wallet resolvable — stopping before createOnrampOrder)");
    return;
  }
  console.log(`\n[order] recipient wallet: ${wallet}`);

  const order = {
    fiatAmount: Number(process.env.PAJ_FIAT_AMOUNT ?? 1000),
    currency: "NGN",
    recipient: wallet,
    mint: process.env.PAJ_MINT ?? MAINNET_USDC,
    chain: Chain.SOLANA,
    webhookURL: process.env.PAJ_WEBHOOK_URL ?? "https://example.com/payments/paj-webhook",
  };
  console.log("\n[phase 2] createOnrampOrder() …", order);
  const created = await createOnrampOrder(order, token);
  console.log("\n[phase 2] ✅ ORDER CREATED — pay NGN into this account to complete:");
  console.log(JSON.stringify(created, null, 2));
}

main().catch((err) => {
  console.error("\n❌ PAJ smoke test failed:");
  console.error(err instanceof Error ? `${err.message}\n${err.stack ?? ""}` : err);
  process.exit(1);
});
