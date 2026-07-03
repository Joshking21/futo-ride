import { z } from "zod";

export const BookRide = z
  .object({
    fromStop: z.string().min(1),
    toStop: z.string().min(1),
    payMethod: z.enum(["naira", "cngn"]),
    priorityFee: z.number().int().nonnegative().optional(), // kobo
    seats: z.number().int().min(1).max(4).default(1), // seats to book (4 = charter the keke)
  })
  .refine((b) => b.fromStop !== b.toStop, {
    message: "from and to must differ",
    path: ["toStop"],
  });

export const CompleteRide = z.object({
  qrToken: z.string().min(1),
});

/** Driver advances the trip through the mid-ride states (assigned→arriving→started). */
export const UpdateRideStatus = z.object({
  status: z.enum(["arriving", "started"]),
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
