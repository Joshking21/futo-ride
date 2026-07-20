use anchor_lang::prelude::*;

#[error_code]
pub enum VaultError {
    #[msg("Only the vault authority can perform this action")]
    Unauthorized,
    #[msg("Payout exceeds the per-payout cap")]
    PayoutTooLarge,
    #[msg("Vault has insufficient USDC for this payout")]
    InsufficientFunds,
    #[msg("Amount must be greater than zero")]
    ZeroAmount,
    #[msg("Token account mint does not match the vault USDC mint")]
    WrongMint,
    #[msg("Arithmetic overflow")]
    MathOverflow,
}
