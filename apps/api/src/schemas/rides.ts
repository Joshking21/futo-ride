import { z } from "zod";

export const BookRide = z
  .object({
    fromStop: z.string().min(1),
    toStop: z.string().min(1),
    payMethod: z.enum(["naira", "cngn"]),
    priorityFee: z.number().int().nonnegative().optional(), // kobo
  })
  .refine((b) => b.fromStop !== b.toStop, {
    message: "from and to must differ",
    path: ["toStop"],
  });

export const CompleteRide = z.object({
  qrToken: z.string().min(1),
});

export const RateRide = z.object({
  stars: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export const RideId = z.object({
  id: z.string().min(1),
});

export type BookRideInput = z.infer<typeof BookRide>;
export type RateRideInput = z.infer<typeof RateRide>;
