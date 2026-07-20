/**
 * Vault smoke test — proves the backend's on-chain welfare-vault path end-to-end
 * against the configured cluster (devnet), independent of the ride flow.
 *
 * Reads the live vault state, contributes the USDC equivalent of one ride's 5% welfare
 * cut (via the SAME lib/vault.ts code the completion handler uses), then re-reads the
 * state so you can see `total_in` / balance grow and get a real on-chain signature.
 *
 * Usage (from apps/api):
 *   npx tsx --env-file=../../.env.local src/scripts/vault-smoke.ts
 */
import { isVaultConfigured, getVaultState, contributeUsdc, koboToUsdcBaseUnits } from "../lib/vault.js";
import { platformCutKobo, seatFareKobo } from "../lib/fare.js";
import { PLATFORM_FEE_BPS } from "../lib/config.js";

async function main() {
  if (!isVaultConfigured()) {
    console.error("❌ Vault not configured — set VAULT_USDC_MINT + VAULT_AUTHORITY_SECRET_KEY in .env.local");
    process.exit(1);
  }

  // The 5% welfare cut of a single 1-seat ride, converted kobo → USDC base units at a test FX
  // rate (SMOKE_NGN_PER_USDC, default 1417 — a recent PAJ onramp rate). In production the rate
  // comes from the payment the rider actually settled at (payment.paidRate).
  const cutKobo = platformCutKobo(seatFareKobo(1), PLATFORM_FEE_BPS);
  const ngnPerUsdc = Number(process.env.SMOKE_NGN_PER_USDC) || 1417;
  const baseUnits = koboToUsdcBaseUnits(cutKobo, ngnPerUsdc);

  const before = await getVaultState();
  console.log("\n=== BEFORE ===");
  console.log("  balance (base units):", before.balanceBaseUnits);
  console.log("  total_in:            ", before.totalIn);
  console.log(`\n→ Contributing ${cutKobo} kobo (5% of a ₦150 ride) = ${baseUnits} USDC base units...`);

  const sig = await contributeUsdc(baseUnits);
  console.log("  ✅ contribute tx:", sig);
  console.log("  explorer: https://explorer.solana.com/tx/" + sig + "?cluster=devnet");

  const after = await getVaultState();
  console.log("\n=== AFTER ===");
  console.log("  balance (base units):", after.balanceBaseUnits, `(was ${before.balanceBaseUnits})`);
  console.log("  total_in:            ", after.totalIn, `(was ${before.totalIn})`);

  const grew = BigInt(after.totalIn) > BigInt(before.totalIn);
  console.log(`\n${grew ? "🎉 vault grew on-chain — backend → devnet contribute works" : "⚠️  total_in did not grow"}\n`);
  process.exit(grew ? 0 : 1);
}

main().catch((err) => {
  console.error("vault-smoke failed:", err);
  process.exit(1);
});
