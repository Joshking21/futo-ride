/**
 * PAJ Ramp OFFRAMP read-path smoke test (production) — validates the driver-payout side
 * WITHOUT moving any money. Reuses the cached session token from paj-smoke.ts (.paj-session.json),
 * so no OTP is needed. It only:
 *   • getBanks(token)                            — list supported banks (Bearer auth check)
 *   • resolveBankAccount(token, bankId, acctNo)  — confirm an account name (only if you supply one)
 *
 * It deliberately does NOT call createOfframpOrder — that returns a deposit address expecting
 * real USDC. This is purely the safe, read-only path.
 *
 * Run from apps/api:
 *   pnpm exec tsx --env-file=../../.env.local src/scripts/paj-offramp-smoke.ts
 *   # optional account resolve:
 *   PAJ_ACCOUNT_NUMBER=0123456789 PAJ_BANK_QUERY=opay \
 *     pnpm exec tsx --env-file=../../.env.local src/scripts/paj-offramp-smoke.ts
 */
import { readFileSync, existsSync } from "node:fs";
import { initializeSDK, getBanks, resolveBankAccount, Environment } from "paj_ramp";

const TOKEN_CACHE = new URL("../../.paj-session.json", import.meta.url);

function loadToken(): string {
  if (process.env.PAJ_SESSION_TOKEN) return process.env.PAJ_SESSION_TOKEN;
  if (!existsSync(TOKEN_CACHE)) {
    throw new Error("No cached session token — run paj-smoke.ts phase 2 first to create .paj-session.json");
  }
  const c = JSON.parse(readFileSync(TOKEN_CACHE, "utf8")) as { token: string; expiresAt?: string };
  if (c.expiresAt && new Date(c.expiresAt).getTime() < Date.now()) {
    throw new Error("Cached token expired — re-run paj-smoke.ts phase 2");
  }
  return c.token;
}

async function main() {
  initializeSDK(
    (process.env.PAJ_ENV ?? "production").toLowerCase() === "staging" ? Environment.Staging : Environment.Production,
  );
  const token = loadToken();
  console.log("\n=== PAJ offramp read-path smoke (production) — using cached token ===");

  console.log("\n[offramp] getBanks() …");
  const banks = await getBanks(token);
  console.log(`[offramp] ${banks.length} banks. First 8:`);
  for (const b of banks.slice(0, 8)) console.log(`  ${b.code}\t${b.id}\t${b.name}`);

  const acctNo = process.env.PAJ_ACCOUNT_NUMBER;
  if (!acctNo) {
    console.log("\n(no PAJ_ACCOUNT_NUMBER set — skipping resolveBankAccount. getBanks alone proves the offramp auth/path.)");
    return;
  }
  const query = (process.env.PAJ_BANK_QUERY ?? "").toLowerCase();
  const bank = banks.find((b) => b.name.toLowerCase().includes(query) || b.code === query);
  if (!bank) {
    console.log(`\nNo bank matched PAJ_BANK_QUERY="${query}". Pick a name/code from the list above.`);
    return;
  }
  console.log(`\n[offramp] resolveBankAccount(${bank.name}, ${acctNo}) …`);
  const resolved = await resolveBankAccount(token, bank.id, acctNo);
  console.log("[offramp] ✅ resolved:", JSON.stringify(resolved, null, 2));
}

main().catch((err) => {
  console.error("\n❌ PAJ offramp smoke failed:");
  console.error(err instanceof Error ? `${err.message}\n${err.stack ?? ""}` : err);
  process.exit(1);
});
