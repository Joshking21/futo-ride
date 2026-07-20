use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::{constants::*, error::VaultError, state::Vault};

/// Moves USDC OUT of the vault to a recipient (a driver's wallet token account,
/// or Partna's offramp deposit account for a bank payout). Only the vault
/// `authority` (your backend key) may call this, and never above `max_payout`.
/// This one instruction serves BOTH driver withdrawals AND approved insurance
/// claims — the program doesn't care why; the backend decides.
#[derive(Accounts)]
pub struct Payout<'info> {
    /// Must equal `vault.authority` (enforced by `has_one`).
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [VAULT_SEED],
        bump = vault.bump,
        has_one = authority @ VaultError::Unauthorized,
    )]
    pub vault: Account<'info, Vault>,

    #[account(mut, seeds = [VAULT_TOKEN_SEED], bump)]
    pub vault_token: Account<'info, TokenAccount>,

    /// Where the USDC goes — must be a token account for the vault's mint.
    #[account(
        mut,
        constraint = recipient_token.mint == vault.usdc_mint @ VaultError::WrongMint,
    )]
    pub recipient_token: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handle_payout(ctx: Context<Payout>, amount: u64) -> Result<()> {
    require!(amount > 0, VaultError::ZeroAmount);
    require!(amount <= ctx.accounts.vault.max_payout, VaultError::PayoutTooLarge);
    require!(
        ctx.accounts.vault_token.amount >= amount,
        VaultError::InsufficientFunds
    );

    // The vault PDA is the token account's authority, so the PROGRAM signs the
    // transfer out using the vault's seeds — no private key exists for this address.
    let bump = ctx.accounts.vault.bump;
    let seeds: &[&[u8]] = &[VAULT_SEED, &[bump]];
    let signer: &[&[&[u8]]] = &[seeds];

    let cpi_accounts = Transfer {
        from: ctx.accounts.vault_token.to_account_info(),
        to: ctx.accounts.recipient_token.to_account_info(),
        authority: ctx.accounts.vault.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.key(),
        cpi_accounts,
        signer,
    );
    token::transfer(cpi_ctx, amount)?;

    let vault = &mut ctx.accounts.vault;
    vault.total_out = vault.total_out.checked_add(amount).ok_or(VaultError::MathOverflow)?;

    msg!("Paid out {} from vault (total_out={})", amount, vault.total_out);
    Ok(())
}
