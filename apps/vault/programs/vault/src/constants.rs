use anchor_lang::prelude::*;

/// Seed for the vault config PDA (holds authority, mint, stats, cap).
#[constant]
pub const VAULT_SEED: &[u8] = b"vault";

/// Seed for the vault's USDC token account PDA (where the money actually sits).
#[constant]
pub const VAULT_TOKEN_SEED: &[u8] = b"vault-token";
