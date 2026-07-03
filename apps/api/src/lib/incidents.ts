/**
 * Incident pipeline: event → AI triage → persist → Alerta → SUG Security Telegram.
 * Shared by the SOS/report routes and the "stranded student" path in POST /rides.
 * A high-confidence false alarm is still sent — tagged — so security stays the judge.
 */

import { adminDb } from "./firestore.js";
import { triageIncident } from "./ai-triage.js";
import { sendTelegramAlert } from "./alerta.js";
import type { Incident, Severity } from "../types/index.js";

const SEVERITY_EMOJI: Record<Severity, string> = {
  critical: "🔴",
  high: "🟠",
  medium: "🟡",
  info: "🔵",
};

/** A Google Maps link for a coordinate, used in the alert meta. */
export function mapsLink(lat: number, lng: number): string {
  return `https://maps.google.com/?q=${lat},${lng}`;
}

export interface RaiseIncidentParams {
  riderId: string;
  type: string;
  message: string;
  location: string;
  rideId?: string;
}

/**
 * Triages an event with the LLM, persists it to `incidents`, and alerts SUG
 * Security on Telegram. Returns the new incident id. Callers pass a prebuilt
 * `location` string (a maps link or a stop description) so this stays agnostic
 * about whether the event has GPS coords.
 */
export async function raiseIncident(params: RaiseIncidentParams): Promise<string> {
  const { riderId, type, message, location, rideId } = params;
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
