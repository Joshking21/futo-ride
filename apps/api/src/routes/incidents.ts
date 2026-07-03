import type { FastifyInstance } from "fastify";
import { verifyRequest } from "../lib/auth.js";
import { ok } from "../lib/http.js";
import { raiseIncident, mapsLink } from "../lib/incidents.js";
import { Sos, ReportIncident } from "../schemas/incidents.js";

export default async function incidentRoutes(app: FastifyInstance) {
  app.post("/sos", async (req) => {
    const user = await verifyRequest(req);
    const body = Sos.parse(req.body);

    const incidentId = await raiseIncident({
      riderId: user.uid,
      type: "sos",
      message: body.message ?? "Rider triggered SOS.",
      location: mapsLink(body.lat, body.lng),
      rideId: body.rideId,
    });
    return ok({ incidentId });
  });

  app.post("/incidents/report", async (req) => {
    const user = await verifyRequest(req);
    const body = ReportIncident.parse(req.body);

    const incidentId = await raiseIncident({
      riderId: user.uid,
      type: body.type,
      message: body.message,
      location: mapsLink(body.lat, body.lng),
      rideId: body.rideId,
    });
    return ok({ incidentId });
  });
}
