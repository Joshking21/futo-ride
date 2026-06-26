import { z } from "zod";

export const InitPayment = z.object({
  rideId: z.string().min(1),
});

export const VerifyPayment = z.object({
  reference: z.string().min(1),
});

export type InitPaymentInput = z.infer<typeof InitPayment>;
export type VerifyPaymentInput = z.infer<typeof VerifyPayment>;
