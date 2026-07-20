/**
 * On-chain welfare/treasury vault client (Solana, devnet) — the backend edge for the
 * Anchor `vault` program in `apps/vault` (PROJECT_PLAN todo.md S2/S4).
 *
 * The vault holds USDC in a PDA-owned token account. This module lets the backend:
 *   • `contributeUsdc` — move the platform's welfare cut INTO the vault (best-effort,
 *     mirrors the `treasuryContributions` ledger which stays the source of truth),
 *   • `payoutUsdc`     — move USDC OUT (authority-signed, capped) for driver withdrawals
 *     or approved insurance claims (the on-chain leg; wiring is deferred),
 *   • `getVaultState`  — read the live on-chain balance + lifetime stats (transparency).
 *
 * Everything is OPTIONAL: if the vault env isn't configured, `isVaultConfigured()` is
 * false and callers skip the on-chain leg entirely — the naira/ledger flow is untouched.
 * Money is USDC base units (6 dp) at this edge; kobo everywhere else (see lib/money.ts).
 */
import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress, getAccount, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { VAULT_IDL } from "./vault-idl.js";

// reason: the IDL is loaded as a plain object; the Anchor Program is typed dynamically.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const idl = VAULT_IDL as any;

// @coral-xyz/anchor's CJS build doesn't surface BN as a top-level ESM export, so reach it
// through the interop default (works under both ESM/tsx and the tsc→CJS prod build).
// reason: runtime interop for a value the ESM namespace doesn't expose.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BN: any = (anchor as any).BN ?? (anchor as any).default?.BN;

const DEFAULT_RPC = "https://api.devnet.solana.com";
const VAULT_SEED = Buffer.from("vault");
const VAULT_TOKEN_SEED = Buffer.from("vault-token");

/** True once the vault env is present — else callers skip the on-chain leg. */
export function isVaultConfigured(): boolean {
  return Boolean(process.env.VAULT_USDC_MINT && process.env.VAULT_AUTHORITY_SECRET_KEY);
}

type VaultClient = {
  // reason: IDL is loaded at runtime; methods/account accessors are validated against the on-chain program.
  program: anchor.Program<anchor.Idl>;
  connection: Connection;
  authority: Keypair;
  usdcMint: PublicKey;
  vaultPda: PublicKey;
  vaultTokenPda: PublicKey;
};

let cached: VaultClient | null = null;

function client(): VaultClient {
  if (cached) return cached;
  if (!isVaultConfigured()) throw new Error("Vault not configured (VAULT_USDC_MINT / VAULT_AUTHORITY_SECRET_KEY)");

  const connection = new Connection(process.env.SOLANA_RPC_URL ?? DEFAULT_RPC, "confirmed");
  const secret = Uint8Array.from(JSON.parse(process.env.VAULT_AUTHORITY_SECRET_KEY!));
  const authority = Keypair.fromSecretKey(secret);
  const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(authority), {
    commitment: "confirmed",
  });
  const program = new anchor.Program(idl, provider);
  const usdcMint = new PublicKey(process.env.VAULT_USDC_MINT!);
  const [vaultPda] = PublicKey.findProgramAddressSync([VAULT_SEED], program.programId);
  const [vaultTokenPda] = PublicKey.findProgramAddressSync([VAULT_TOKEN_SEED], program.programId);

  cached = { program, connection, authority, usdcMint, vaultPda, vaultTokenPda };
  return cached;
}

type VaultAccount = {
  authority: PublicKey;
  usdcMint: PublicKey;
  totalIn: anchor.BN;
  totalOut: anchor.BN;
  maxPayout: anchor.BN;
  bump: number;
};

/** Live on-chain vault snapshot: current USDC balance + lifetime in/out + config. */
export async function getVaultState(): Promise<{
  balanceBaseUnits: string;
  totalIn: string;
  totalOut: string;
  maxPayout: string;
  usdcMint: string;
  authority: string;
  programId: string;
  vaultTokenAccount: string;
}> {
  const c = client();
  // reason: IDL-typed program — the `vault` account accessor is validated at runtime.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const acct = (await (c.program.account as any).vault.fetch(c.vaultPda)) as VaultAccount;
  const tokenAcct = await getAccount(c.connection, c.vaultTokenPda);
  return {
    balanceBaseUnits: tokenAcct.amount.toString(),
    totalIn: acct.totalIn.toString(),
    totalOut: acct.totalOut.toString(),
    maxPayout: acct.maxPayout.toString(),
    usdcMint: acct.usdcMint.toBase58(),
    authority: acct.authority.toBase58(),
    programId: c.program.programId.toBase58(),
    vaultTokenAccount: c.vaultTokenPda.toBase58(),
  };
}

/**
 * Moves USDC into the vault from the authority's (treasury) token account. Returns the
 * transaction signature. Throws on any RPC/program error — callers wrap in `.catch()`.
 */
export async function contributeUsdc(baseUnits: number): Promise<string> {
  const c = client();
  const contributorToken = await getAssociatedTokenAddress(c.usdcMint, c.authority.publicKey);
  return c.program.methods
    .contribute(new BN(baseUnits))
    .accountsPartial({
      contributor: c.authority.publicKey,
      contributorToken,
      vault: c.vaultPda,
      vaultToken: c.vaultTokenPda,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
}

/**
 * Moves USDC out of the vault to a recipient token account (a driver's wallet ATA, or a
 * Partna offramp deposit account). Authority-signed + capped on-chain. Returns the tx sig.
 */
export async function payoutUsdc(recipientToken: PublicKey, baseUnits: number): Promise<string> {
  const c = client();
  return c.program.methods
    .payout(new BN(baseUnits))
    .accountsPartial({
      authority: c.authority.publicKey,
      vault: c.vaultPda,
      vaultToken: c.vaultTokenPda,
      recipientToken,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
}

/**
 * Converts internal kobo to USDC base units (6 dp) at the **live NGN→USDC rate the rider
 * actually settled at** (PAJ returns it per order/webhook as `rate`, in NGN per USD ≈ NGN per
 * USDC). The rate is REQUIRED — there is deliberately no static/default fallback: a hardcoded FX
 * guess silently mis-sizes on-chain contributions, so any caller that doesn't know the real rate
 * must skip the on-chain leg rather than invent one.
 */
export function koboToUsdcBaseUnits(kobo: number, ngnPerUsdc: number): number {
  if (!(ngnPerUsdc > 0)) throw new Error("koboToUsdcBaseUnits: a positive live NGN→USDC rate is required");
  // kobo → naira (÷100) → USDC (÷rate) → base units (×1e6)  ==  kobo × 1e4 ÷ rate
  return Math.round((kobo * 10_000) / ngnPerUsdc);
}
