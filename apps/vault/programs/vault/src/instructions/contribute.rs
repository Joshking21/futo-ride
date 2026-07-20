use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::{constants::*, error::VaultError, state::Vault};

/// Moves USDC INTO the vault. Anyone can contribute (e.g. the backend moving the
/// 5% welfare cut, or a manual top-up). The contributor signs their own transfer,
/// so no PDA signing is needed here — the money is leaving THEIR token account.
#[derive(Accounts)]
pub struct Contribute<'info> {
    /// Whoever is funding the vault (signs the token transfer out of their account).
    pub contributor: Signer<'info>,

    /// The contributor's USDC token account — must hold the vault's mint.
    #[account(
        mut,
        constraint = contributor_token.mint == vault.usdc_mint @ VaultError::WrongMint,
    )]
    pub contributor_token: Account<'info, TokenAccount>,

    #[account(mut, seeds = [VAULT_SEED], bump = vault.bump)]
    pub vault: Account<'info, Vault>,

    #[account(mut, seeds = [VAULT_TOKEN_SEED], bump)]
    pub vault_token: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handle_contribute(ctx: Context<Contribute>, amount: u64) -> Result<()> {
    require!(amount > 0, VaultError::ZeroAmount);

    // CPI: SPL Token transfer, authorized by the contributor (a normal signer).
    let cpi_accounts = Transfer {
        from: ctx.accounts.contributor_token.to_account_info(),
        to: ctx.accounts.vault_token.to_account_info(),
        authority: ctx.accounts.contributor.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(ctx.accounts.token_program.key(), cpi_accounts);
    token::transfer(cpi_ctx, amount)?;

    let vault = &mut ctx.accounts.vault;
    vault.total_in = vault.total_in.checked_add(amount).ok_or(VaultError::MathOverflow)?;

    msg!("Contributed {} to vault (total_in={})", amount, vault.total_in);
    Ok(())
}
