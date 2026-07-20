use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::{constants::*, state::Vault};

/// Creates the vault: the config PDA + the USDC token account it controls.
/// Called once. Whoever signs becomes the `authority` (the backend key).
#[derive(Accounts)]
pub struct Initialize<'info> {
    /// Pays rent + becomes the vault authority.
    #[account(mut)]
    pub authority: Signer<'info>,

    /// The vault config PDA — derived from a fixed seed, so there's exactly one.
    #[account(
        init,
        payer = authority,
        space = 8 + Vault::INIT_SPACE,
        seeds = [VAULT_SEED],
        bump
    )]
    pub vault: Account<'info, Vault>,

    /// The USDC mint this vault will hold.
    pub usdc_mint: Account<'info, Mint>,

    /// The vault's USDC pocket — a token account owned (authority) by the vault
    /// PDA, so only this program can move USDC out of it.
    #[account(
        init,
        payer = authority,
        seeds = [VAULT_TOKEN_SEED],
        bump,
        token::mint = usdc_mint,
        token::authority = vault,
    )]
    pub vault_token: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handle_initialize(ctx: Context<Initialize>, max_payout: u64) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    vault.authority = ctx.accounts.authority.key();
    vault.usdc_mint = ctx.accounts.usdc_mint.key();
    vault.total_in = 0;
    vault.total_out = 0;
    vault.max_payout = max_payout;
    vault.bump = ctx.bumps.vault;

    msg!("Vault initialized. authority={}, cap={}", vault.authority, max_payout);
    Ok(())
}
