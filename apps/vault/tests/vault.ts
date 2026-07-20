/**
 * FUTO-Ride vault — end-to-end flow on a local validator.
 *
 * Mirrors the real money path with a MOCK USDC (6 decimals, like real USDC):
 *   initialize → contribute (money in) → payout (money out, capped, authority-only).
 * Read top-to-bottom to see how a Solana program is driven from TypeScript — the
 * same client shape your Fastify backend will use later.
 */
import * as anchor from "@coral-xyz/anchor";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Keypair, PublicKey } from "@solana/web3.js";
import { assert, expect } from "chai";
import { Vault } from "../target/types/vault";
import idl from "../target/idl/vault.json";

// USDC has 6 decimals, so 1 USDC = 1_000_000 base units. This helper keeps the
// tests readable: usdc(250) === 250 USDC in the units the program actually moves.
const usdc = (n: number) => new anchor.BN(n * 1_000_000);

describe("vault", () => {
  // `anchor test` sets ANCHOR_PROVIDER_URL + ANCHOR_WALLET; env() picks them up.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const connection = provider.connection;

  // Build the client straight from the generated IDL (programId is in idl.address).
  const program = new anchor.Program(idl as Vault, provider);

  // The provider wallet doubles as: rent payer, mint authority, and vault authority.
  const payer = (provider.wallet as anchor.Wallet).payer;

  // The two PDAs — derived from the same seeds the Rust program uses.
  const [vaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault")],
    program.programId,
  );
  const [vaultTokenPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault-token")],
    program.programId,
  );

  let usdcMint: PublicKey;
  let payerUsdc: PublicKey; // the "contributor" token account
  const driver = Keypair.generate();
  let driverUsdc: PublicKey; // the payout recipient

  before(async () => {
    // Mint a fake USDC and give the payer 1000 of it to contribute.
    usdcMint = await createMint(connection, payer, payer.publicKey, null, 6);

    payerUsdc = (
      await getOrCreateAssociatedTokenAccount(connection, payer, usdcMint, payer.publicKey)
    ).address;
    await mintTo(connection, payer, usdcMint, payerUsdc, payer, 1000 * 1_000_000);

    driverUsdc = (
      await getOrCreateAssociatedTokenAccount(connection, payer, usdcMint, driver.publicKey)
    ).address;
  });

  it("initializes the vault (cap = 500 USDC)", async () => {
    await program.methods
      .initialize(usdc(500))
      .accountsPartial({
        authority: payer.publicKey,
        vault: vaultPda,
        usdcMint,
        vaultToken: vaultTokenPda,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const vault = await program.account.vault.fetch(vaultPda);
    expect(vault.authority.toBase58()).to.equal(payer.publicKey.toBase58());
    expect(vault.usdcMint.toBase58()).to.equal(usdcMint.toBase58());
    expect(vault.maxPayout.toString()).to.equal(usdc(500).toString());
    expect(vault.totalIn.toNumber()).to.equal(0);

    // The vault's USDC pocket exists and starts empty.
    const vaultBal = await getAccount(connection, vaultTokenPda);
    expect(Number(vaultBal.amount)).to.equal(0);
  });

  it("contributes 250 USDC into the vault", async () => {
    await program.methods
      .contribute(usdc(250))
      .accountsPartial({
        contributor: payer.publicKey,
        contributorToken: payerUsdc,
        vault: vaultPda,
        vaultToken: vaultTokenPda,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const vaultBal = await getAccount(connection, vaultTokenPda);
    expect(Number(vaultBal.amount)).to.equal(250 * 1_000_000);
    const vault = await program.account.vault.fetch(vaultPda);
    expect(vault.totalIn.toNumber()).to.equal(250 * 1_000_000);
  });

  it("pays out 100 USDC to the driver", async () => {
    await program.methods
      .payout(usdc(100))
      .accountsPartial({
        authority: payer.publicKey,
        vault: vaultPda,
        vaultToken: vaultTokenPda,
        recipientToken: driverUsdc,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const driverBal = await getAccount(connection, driverUsdc);
    expect(Number(driverBal.amount)).to.equal(100 * 1_000_000); // driver got paid

    const vaultBal = await getAccount(connection, vaultTokenPda);
    expect(Number(vaultBal.amount)).to.equal(150 * 1_000_000); // 250 - 100 left

    const vault = await program.account.vault.fetch(vaultPda);
    expect(vault.totalOut.toNumber()).to.equal(100 * 1_000_000);
  });

  it("rejects a payout above the cap", async () => {
    try {
      await program.methods
        .payout(usdc(600)) // > 500 cap
        .accountsPartial({
          authority: payer.publicKey,
          vault: vaultPda,
          vaultToken: vaultTokenPda,
          recipientToken: driverUsdc,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();
      assert.fail("expected PayoutTooLarge");
    } catch (e) {
      expect((e as Error).toString()).to.include("PayoutTooLarge");
    }
  });

  it("rejects a payout from a non-authority signer", async () => {
    const attacker = Keypair.generate();
    try {
      await program.methods
        .payout(usdc(10))
        .accountsPartial({
          authority: attacker.publicKey,
          vault: vaultPda,
          vaultToken: vaultTokenPda,
          recipientToken: driverUsdc,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([attacker])
        .rpc();
      assert.fail("expected Unauthorized");
    } catch (e) {
      expect((e as Error).toString()).to.include("Unauthorized");
    }
  });
});
