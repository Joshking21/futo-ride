import { z } from "zod";

const lat = z.number().min(-90).max(90);
const lng = z.number().min(-180).max(180);

export const Sos = z.object({
  rideId: z.string().min(1).optional(),
  message: z.string().max(500).optional(),
  lat,
  lng,
});

export const ReportIncident = z.object({
  rideId: z.string().min(1).optional(),
  type: z.string().min(1),
  message: z.string().min(1).max(500),
  lat,
  lng,
});

export type SosInput = z.infer<typeof Sos>;
export type ReportIncidentInput = z.infer<typeof ReportIncident>;
