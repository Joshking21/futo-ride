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

export type GoOnlineInput = z.infer<typeof GoOnline>;
export type UpdateLocationInput = z.infer<typeof UpdateLocation>;
