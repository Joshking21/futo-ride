import { z } from "zod";

const lat = z.number().min(-90).max(90);
const lng = z.number().min(-180).max(180);

export const GoOnline = z.object({
  online: z.boolean(),
  lat: lat.optional(),
  lng: lng.optional(),
});

export const UpdateLocation = z.object({
  lat,
  lng,
});

export const DriverId = z.object({
  id: z.string().min(1),
});

/** Keke driver onboarding (§20.6). */
export const RegisterDriver = z.object({
  name: z.string().min(1).max(100),
  plate: z.string().min(1).max(20),
});

/** Driver batch withdrawal of ledger earnings (§21/P3) — offramp to bank or on-chain wallet. */
export const WithdrawEarnings = z
  .object({
    amountKobo: z.number().int().positive(),
    method: z.enum(["bank", "wallet"]),
    accountNumber: z.string().optional(),
    bankCode: z.string().optional(),
    walletAddress: z.string().optional(),
  })
  .refine((b) => (b.method === "bank" ? Boolean(b.accountNumber && b.bankCode) : Boolean(b.walletAddress)), {
    message: "bank withdrawal needs accountNumber+bankCode; wallet withdrawal needs walletAddress",
    path: ["method"],
  });

export type GoOnlineInput = z.infer<typeof GoOnline>;
export type UpdateLocationInput = z.infer<typeof UpdateLocation>;
export type RegisterDriverInput = z.infer<typeof RegisterDriver>;
export type WithdrawEarningsInput = z.infer<typeof WithdrawEarnings>;
