import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { ok } from "../lib/http.js";
import { readSurge } from "../lib/surge.js";

const Zone = z.object({ zone: z.string().min(1) });

/** Read-only surge state for a zone (pickup stop) — drives the rider's priority button. */
export default async function surgeRoutes(app: FastifyInstance) {
  app.get("/surge/:zone", async (req) => {
    const { zone } = Zone.parse(req.params);
    const state = await readSurge(zone);
    return ok({ zone, surge: state });
  });
}
