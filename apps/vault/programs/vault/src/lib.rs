pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("G7nJBuH6R7TkeKHKxEKMoL384kJ6rJGioLADw2yBaQpZ");

#[program]
pub mod vault {
    use super::*;

    /// Create the vault once. `max_payout` caps any single payout (base units).
    pub fn initialize(ctx: Context<Initialize>, max_payout: u64) -> Result<()> {
        instructions::initialize::handle_initialize(ctx, max_payout)
    }

    /// Move USDC into the vault (the 5% welfare cut, or a manual top-up).
    pub fn contribute(ctx: Context<Contribute>, amount: u64) -> Result<()> {
        instructions::contribute::handle_contribute(ctx, amount)
    }

    /// Move USDC out to a recipient — authority-only, capped. Serves both
    /// driver withdrawals and (later) approved insurance claims.
    pub fn payout(ctx: Context<Payout>, amount: u64) -> Result<()> {
        instructions::payout::handle_payout(ctx, amount)
    }
}
