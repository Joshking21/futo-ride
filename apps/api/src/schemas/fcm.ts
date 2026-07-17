import { z } from "zod";

/** FCM device token registration / removal body. */
export const FcmToken = z.object({
  token: z.string().min(1),
});

export type FcmTokenInput = z.infer<typeof FcmToken>;
