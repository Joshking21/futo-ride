import { z } from "zod";

export const RouteId = z.object({
  id: z.string().min(1),
});

export const RouteEtaQuery = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

export const ProximityOptIn = z.object({
  routeId: z.string().min(1),
  stopId: z.string().min(1),
  enabled: z.boolean().default(true),
});

export const BusLocation = z.object({
  routeId: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

/** Bus-driver onboarding (§21/H6) — explicit register step, no whitelist. */
export const RegisterBus = z.object({
  name: z.string().min(1).max(100),
  plate: z.string().min(1).max(20),
  routeId: z.string().min(1),
});

export type ProximityOptInInput = z.infer<typeof ProximityOptIn>;
export type BusLocationInput = z.infer<typeof BusLocation>;
export type RegisterBusInput = z.infer<typeof RegisterBus>;
