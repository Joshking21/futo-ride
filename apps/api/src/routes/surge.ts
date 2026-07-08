import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { ok } from "../lib/http.js";
import { evaluateSurge } from "../lib/surge.js";

const Zone = z.object({ zone: z.string().min(1) });

/** Live surge state for a zone (pickup stop) — drives the rider's priority button (§20). */
export default async function surgeRoutes(app: FastifyInstance) {
  app.get("/surge/:zone", async (req) => {
    const { zone } = Zone.parse(req.params);
    const { state } = await evaluateSurge(zone);
    return ok({ zone, surge: state });
  });
}
