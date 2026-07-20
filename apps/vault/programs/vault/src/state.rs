use anchor_lang::prelude::*;

/// The vault config account (a PDA). Holds no money itself — it's the "brain":
/// who may pay out, which token it holds, running stats, and the per-payout cap.
/// The actual USDC lives in a separate token account (`vault-token` PDA) whose
/// authority is THIS account, so only the program can sign money out.
#[account]
#[derive(InitSpace)]
pub struct Vault {
    /// The only key allowed to authorize `payout` (your backend's Solana keypair).
    pub authority: Pubkey,
    /// The token this vault accepts/holds (USDC mint).
    pub usdc_mint: Pubkey,
    /// Lifetime USDC contributed in (base units) — transparency stat.
    pub total_in: u64,
    /// Lifetime USDC paid out (base units) — transparency stat.
    pub total_out: u64,
    /// Guardrail: a single payout can never exceed this (base units).
    pub max_payout: u64,
    /// Stored PDA bump so we can re-derive + sign cheaply.
    pub bump: u8,
}
