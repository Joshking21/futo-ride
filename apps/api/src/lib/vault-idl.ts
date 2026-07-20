/**
 * Vendored Anchor IDL for the `vault` program (kept in sync with
 * apps/vault/target/idl/vault.json). A `.ts` module (not `.json`) so it compiles into
 * `dist/` on the prod `tsc` build without a separate copy step. Consumed by lib/vault.ts.
 */
export const VAULT_IDL = {
  address: "G7nJBuH6R7TkeKHKxEKMoL384kJ6rJGioLADw2yBaQpZ",
  metadata: { name: "vault", version: "0.1.0", spec: "0.1.0", description: "FUTO-Ride welfare/treasury vault" },
  instructions: [
    {
      name: "contribute",
      discriminator: [82, 33, 68, 131, 32, 0, 205, 95],
      accounts: [
        { name: "contributor", signer: true },
        { name: "contributor_token", writable: true },
        { name: "vault", writable: true, pda: { seeds: [{ kind: "const", value: [118, 97, 117, 108, 116] }] } },
        { name: "vault_token", writable: true, pda: { seeds: [{ kind: "const", value: [118, 97, 117, 108, 116, 45, 116, 111, 107, 101, 110] }] } },
        { name: "token_program", address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
      ],
      args: [{ name: "amount", type: "u64" }],
    },
    {
      name: "initialize",
      discriminator: [175, 175, 109, 31, 13, 152, 155, 237],
      accounts: [
        { name: "authority", writable: true, signer: true },
        { name: "vault", writable: true, pda: { seeds: [{ kind: "const", value: [118, 97, 117, 108, 116] }] } },
        { name: "usdc_mint" },
        { name: "vault_token", writable: true, pda: { seeds: [{ kind: "const", value: [118, 97, 117, 108, 116, 45, 116, 111, 107, 101, 110] }] } },
        { name: "token_program", address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
        { name: "system_program", address: "11111111111111111111111111111111" },
      ],
      args: [{ name: "max_payout", type: "u64" }],
    },
    {
      name: "payout",
      discriminator: [149, 140, 194, 236, 174, 189, 6, 239],
      accounts: [
        { name: "authority", signer: true, relations: ["vault"] },
        { name: "vault", writable: true, pda: { seeds: [{ kind: "const", value: [118, 97, 117, 108, 116] }] } },
        { name: "vault_token", writable: true, pda: { seeds: [{ kind: "const", value: [118, 97, 117, 108, 116, 45, 116, 111, 107, 101, 110] }] } },
        { name: "recipient_token", writable: true },
        { name: "token_program", address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
      ],
      args: [{ name: "amount", type: "u64" }],
    },
  ],
  accounts: [{ name: "Vault", discriminator: [211, 8, 232, 43, 2, 152, 117, 119] }],
  errors: [
    { code: 6000, name: "Unauthorized", msg: "Only the vault authority can perform this action" },
    { code: 6001, name: "PayoutTooLarge", msg: "Payout exceeds the per-payout cap" },
    { code: 6002, name: "InsufficientFunds", msg: "Vault has insufficient USDC for this payout" },
    { code: 6003, name: "ZeroAmount", msg: "Amount must be greater than zero" },
    { code: 6004, name: "WrongMint", msg: "Token account mint does not match the vault USDC mint" },
    { code: 6005, name: "MathOverflow", msg: "Arithmetic overflow" },
  ],
  types: [
    {
      name: "Vault",
      type: {
        kind: "struct",
        fields: [
          { name: "authority", type: "pubkey" },
          { name: "usdc_mint", type: "pubkey" },
          { name: "total_in", type: "u64" },
          { name: "total_out", type: "u64" },
          { name: "max_payout", type: "u64" },
          { name: "bump", type: "u8" },
        ],
      },
    },
  ],
  constants: [
    { name: "VAULT_SEED", type: "bytes", value: "[118, 97, 117, 108, 116]" },
    { name: "VAULT_TOKEN_SEED", type: "bytes", value: "[118, 97, 117, 108, 116, 45, 116, 111, 107, 101, 110]" },
  ],
} as const;
