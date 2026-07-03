import type { FastifyInstance } from "fastify";
import { ok } from "../lib/http.js";
import { CAMPUS_STOPS } from "../lib/campus-stops.js";

/** Campus stops (buildings + town) for the keke From/To pickers. */
export default async function stopRoutes(app: FastifyInstance) {
  app.get("/stops", async () => {
    return ok({ stops: CAMPUS_STOPS });
  });
}
