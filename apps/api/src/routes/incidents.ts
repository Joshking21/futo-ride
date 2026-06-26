import type { FastifyInstance } from "fastify";
import { verifyRequest } from "../lib/auth.js";
import { adminDb } from "../lib/firestore.js";
import { ok } from "../lib/http.js";
import { triageIncident } from "../lib/ai-triage.js";
import { sendTelegramAlert } from "../lib/alerta.js";
import { Sos, ReportIncident } from "../schemas/incidents.js";
import type { Incident, Severity } from "../types/index.js";

const SEVERITY_EMOJI: Record<Severity, string> = {
  critical: "🔴",
  high: "🟠",
  medium: "🟡",
  info: "🔵",
};

function mapsLink(lat: number, lng: number): string {
  return `https://maps.google.com/?q=${lat},${lng}`;
}

/**
 * Triage an event with the LLM, persist it, and alert SUG Security on Telegram.
 * A high-confidence false alarm is still sent — tagged — so security stays the judge.
 */
async function raiseIncident(params: {
  riderId: string;
  type: string;
  message: string;
  lat: number;
  lng: number;
  rideId?: string;
}): Promise<string> {
  const { riderId, type, message, lat, lng, rideId } = params;
  const location = mapsLink(lat, lng);
  const now = new Date();

  const triage = await triageIncident({
    type,
    message,
    location,
    timeOfDay: now.toTimeString().slice(0, 5),
    rideId,
  });

  const ref = adminDb().collection("incidents").doc();
  const incident: Incident = {
    id: ref.id,
    ...(rideId ? { rideId } : {}),
    type,
    severity: triage.severity,
    aiSeverity: triage.severity,
    aiSummary: triage.summary,
    location,
    status: "open",
    createdAt: now.getTime(),
  };
  await ref.set({ ...incident, riderId });

  const tag = triage.isLikelyFalseAlarm ? " (AI: possible false alarm)" : "";
  await sendTelegramAlert({
    title: `${SEVERITY_EMOJI[triage.severity]} ${type.toUpperCase()}${tag}`,
    severity: triage.severity,
    message: `AI: ${triage.summary} — ${triage.action}`,
    meta: {
      incident_id: ref.id,
      ...(rideId ? { ride_id: rideId } : {}),
      location,
      time: incident.createdAt,
      ai_confidence: triage.confidence,
    },
  });

  return ref.id;
}

export default async function incidentRoutes(app: FastifyInstance) {
  app.post("/sos", async (req) => {
    const user = await verifyRequest(req);
    const body = Sos.parse(req.body);

    const incidentId = await raiseIncident({
      riderId: user.uid,
      type: "sos",
      message: body.message ?? "Rider triggered SOS.",
      lat: body.lat,
      lng: body.lng,
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
      lat: body.lat,
      lng: body.lng,
      rideId: body.rideId,
    });
    return ok({ incidentId });
  });
}
