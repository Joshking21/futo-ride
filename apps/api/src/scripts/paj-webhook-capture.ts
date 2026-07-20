/**
 * Capture a REAL PAJ onramp webhook — so we can build the webhook handler against verified
 * fields (payload shape + any auth signature) instead of guessing. Uses the cached platform
 * session token; sends the webhook to a webhook.site URL we can read back over its API.
 *
 * ⚠️ This creates a REAL production order. Money only moves if you actually pay the ₦ into the
 * returned account — that's the whole point (we need a real payment to see the webhook fire).
 *
 * Run from apps/api. Two modes:
 *   1) create:  WEBHOOK_SITE_UUID=<uuid> PAJ_FIAT_AMOUNT=1000 \
 *                 pnpm exec tsx --env-file=../../.env.local src/scripts/paj-webhook-capture.ts create
 *        → prints bank details. Go pay that amount. Then:
 *   2) poll:    pnpm exec tsx --env-file=../../.env.local src/scripts/paj-webhook-capture.ts poll
 *        → dumps every request webhook.site captured (headers + body) + the authoritative
 *          getTransaction() status. Re-run poll after paying until COMPLETED.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { Keypair } from "@solana/web3.js";
import { initializeSDK, createOnrampOrder, getTransaction, Environment, Chain } from "paj_ramp";

const MAINNET_USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const TOKEN_CACHE = new URL("../../.paj-session.json", import.meta.url);
const CAPTURE_STATE = new URL("../../.paj-capture.json", import.meta.url);

function loadToken(): string {
  if (process.env.PAJ_SESSION_TOKEN) return process.env.PAJ_SESSION_TOKEN;
  if (!existsSync(TOKEN_CACHE)) throw new Error("No cached token — run paj-smoke.ts phase 2 first");
  const c = JSON.parse(readFileSync(TOKEN_CACHE, "utf8")) as { token: string; expiresAt?: string };
  if (c.expiresAt && new Date(c.expiresAt).getTime() < Date.now()) throw new Error("Token expired — re-run paj-smoke.ts");
  return c.token;
}

function resolveWallet(): string {
  if (process.env.PAJ_WALLET) return process.env.PAJ_WALLET;
  if (process.env.TREASURY_SOLANA_ADDRESS) return process.env.TREASURY_SOLANA_ADDRESS;
  const secret = process.env.VAULT_AUTHORITY_SECRET_KEY;
  if (!secret) throw new Error("No recipient wallet (PAJ_WALLET / TREASURY_SOLANA_ADDRESS / VAULT_AUTHORITY_SECRET_KEY)");
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(secret))).publicKey.toBase58();
}

function initEnv() {
  initializeSDK(
    (process.env.PAJ_ENV ?? "production").toLowerCase() === "staging" ? Environment.Staging : Environment.Production,
  );
}

async function create() {
  const uuid = process.env.WEBHOOK_SITE_UUID;
  if (!uuid) throw new Error("Set WEBHOOK_SITE_UUID=<the webhook.site token uuid>");
  const webhookURL = `https://webhook.site/${uuid}`;
  const token = loadToken();
  const wallet = resolveWallet();
  const order = {
    fiatAmount: Number(process.env.PAJ_FIAT_AMOUNT ?? 1000),
    currency: "NGN",
    recipient: wallet,
    mint: process.env.PAJ_MINT ?? MAINNET_USDC,
    chain: Chain.SOLANA,
    webhookURL,
  };
  console.log("\n[create] createOnrampOrder() with webhookURL:", webhookURL);
  // The SDK's OnrampOrder type omits usdcAmount/status though the API returns them at runtime.
  const created = (await createOnrampOrder(order, token)) as Awaited<ReturnType<typeof createOnrampOrder>> & {
    usdcAmount: number;
    status: string;
  };
  writeFileSync(CAPTURE_STATE, JSON.stringify({ orderId: created.id, uuid, at: Date.now() }, null, 2));
  console.log("\n✅ ORDER CREATED — PAY THIS TO FIRE THE WEBHOOK:");
  console.log(`   Bank:    ${created.bank}`);
  console.log(`   Account: ${created.accountNumber}`);
  console.log(`   Name:    ${created.accountName}`);
  console.log(`   Amount:  ₦${created.fiatAmount}  →  ${created.usdcAmount} USDC  @ ${created.rate}`);
  console.log(`   OrderId: ${created.id}  (status ${created.status})`);
  console.log("\nAfter paying, run:  ...paj-webhook-capture.ts poll");
}

async function poll() {
  if (!existsSync(CAPTURE_STATE)) throw new Error("No capture state — run `create` first");
  const { orderId, uuid } = JSON.parse(readFileSync(CAPTURE_STATE, "utf8")) as { orderId: string; uuid: string };
  const token = loadToken();

  console.log(`\n[poll] webhook.site captured requests for ${uuid}:`);
  const res = await fetch(`https://webhook.site/token/${uuid}/requests?sorting=newest`);
  const json = (await res.json()) as { data?: Array<Record<string, unknown>> };
  const reqs = json.data ?? [];
  if (reqs.length === 0) {
    console.log("  (none yet — PAJ hasn't posted. Pay the order, then re-run poll.)");
  } else {
    for (const r of reqs) {
      console.log("\n  ── request ──");
      console.log("  method:", r.method, "| ip:", r.ip, "| at:", r.created_at);
      console.log("  headers:", JSON.stringify(r.headers));
      console.log("  content:", r.content);
    }
  }

  console.log(`\n[poll] getTransaction(${orderId}) — authoritative status:`);
  const tx = await getTransaction(token, orderId);
  console.log(JSON.stringify(tx, null, 2));
}

async function main() {
  initEnv();
  const mode = process.argv[2] ?? "create";
  if (mode === "poll") return poll();
  return create();
}

main().catch((err) => {
  console.error("\n❌ capture failed:");
  console.error(err instanceof Error ? `${err.message}\n${err.stack ?? ""}` : err);
  process.exit(1);
});
