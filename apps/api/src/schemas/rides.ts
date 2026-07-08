import { z } from "zod";
import { PRIORITY_FEE_CAP_KOBO } from "../lib/config.js";

export const BookRide = z
  .object({
    fromStop: z.string().min(1),
    toStop: z.string().min(1),
    payMethod: z.enum(["naira"]).default("naira"),
    priorityFee: z.number().int().nonnegative().max(PRIORITY_FEE_CAP_KOBO).optional(), // kobo, capped (§20.10)
    seats: z.number().int().min(1).max(4).default(1), // seats to book (4 = charter the keke)
  })
  .refine((b) => b.fromStop !== b.toStop, {
    message: "from and to must differ",
    path: ["toStop"],
  });

/** Complete by scanned QR token OR typed PIN — exactly one (§20.3). */
export const CompleteRide = z
  .object({
    qrToken: z.string().min(1).optional(),
    pin: z.string().min(1).optional(),
  })
  .refine((b) => Boolean(b.qrToken) !== Boolean(b.pin), {
    message: "provide exactly one of qrToken or pin",
    path: ["qrToken"],
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
