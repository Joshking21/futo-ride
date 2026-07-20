/**
 * One-time devnet setup for the FUTO-Ride vault.
 *
 *   1. Creates OUR OWN devnet "USDC" mint (6 decimals — same as real USDC).
 *      Your id.json wallet is the mint authority, so you can mint test tokens
 *      anytime to simulate Partna settling fares.
 *   2. Calls `initialize` → creates the vault (bound to that mint) + its token
 *      account. Your wallet becomes the vault `authority` (the only key that can
 *      call `payout`).
 *   3. Mints some test USDC to your wallet so you can immediately test contribute.
 *
 * Idempotent: if the vault already exists it just prints the current config.
 *
 * Run (from apps/vault, in the Ubuntu terminal):
 *   npm run init:devnet
 */
import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import * as fs from "fs";
import * as os from "os";
import { Vault } from "../target/types/vault";
import idl from "../target/idl/vault.json";

const RPC = process.env.RPC_URL ?? "https://api.devnet.solana.com";
const MAX_PAYOUT_USDC = 1000; // per-payout cap (guardrail)
const SEED_TEST_USDC = 1000; // test USDC minted to the authority for poking around

async function main() {
  const walletPath = process.env.ANCHOR_WALLET ?? `${os.homedir()}/.config/solana/id.json`;
  const secret = Uint8Array.from(JSON.parse(fs.readFileSync(walletPath, "utf8")));
  const keypair = Keypair.fromSecretKey(secret);
  const connection = new Connection(RPC, "confirmed");
  const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(keypair), {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);
  const program = new anchor.Program<Vault>(idl as Vault, provider);

  const [vaultPda] = PublicKey.findProgramAddressSync([Buffer.from("vault")], program.programId);
  const [vaultTokenPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault-token")],
    program.programId,
  );

  console.log("Authority (id.json):", keypair.publicKey.toBase58());
  console.log("Program:            ", program.programId.toBase58());
  console.log("Vault PDA:          ", vaultPda.toBase58());
  console.log("Vault token account:", vaultTokenPda.toBase58());

  const existing = await program.account.vault.fetchNullable(vaultPda);
  if (existing) {
    console.log("\n✓ Vault already initialized.");
    console.log("  USDC mint:  ", existing.usdcMint.toBase58());
    console.log("  max_payout: ", existing.maxPayout.toString());
    console.log("  total_in:   ", existing.totalIn.toString());
    console.log("  total_out:  ", existing.totalOut.toString());
    return;
  }

  console.log("\n→ Creating devnet test-USDC mint (6 decimals)...");
  const usdcMint = await createMint(connection, keypair, keypair.publicKey, null, 6);
  console.log("  USDC mint:", usdcMint.toBase58());

  console.log("→ Initializing vault...");
  const maxPayout = new anchor.BN(MAX_PAYOUT_USDC).mul(new anchor.BN(1_000_000));
  const sig = await program.methods
    .initialize(maxPayout)
    .accountsPartial({
      authority: keypair.publicKey,
      vault: vaultPda,
      usdcMint,
      vaultToken: vaultTokenPda,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
  console.log("  initialize tx:", sig);

  console.log(`→ Minting ${SEED_TEST_USDC} test USDC to authority...`);
  const ata = await getOrCreateAssociatedTokenAccount(connection, keypair, usdcMint, keypair.publicKey);
  await mintTo(connection, keypair, usdcMint, ata.address, keypair, SEED_TEST_USDC * 1_000_000);
  const bal = await getAccount(connection, ata.address);
  console.log("  authority USDC balance:", Number(bal.amount) / 1_000_000, "USDC");

  console.log("\n=== SAVE THESE (for apps/api config) ===");
  console.log("VAULT_PROGRAM_ID=" + program.programId.toBase58());
  console.log("VAULT_USDC_MINT=" + usdcMint.toBase58());
  console.log("VAULT_PDA=" + vaultPda.toBase58());
  console.log("VAULT_TOKEN_ACCOUNT=" + vaultTokenPda.toBase58());
  console.log("VAULT_AUTHORITY_PUBKEY=" + keypair.publicKey.toBase58());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
