/**
 * Incident pipeline: event → AI triage → persist → Alerta → SUG Security Telegram.
 * Shared by the SOS/report routes and the "stranded student" path in POST /rides.
 * A high-confidence false alarm is still sent — tagged — so security stays the judge.
 */

import { adminDb } from "./firestore.js";
import { triageIncident, type TriageResult } from "./ai-triage.js";
import { sendTelegramAlert } from "./alerta.js";
import type { Incident, Severity } from "../types/index.js";

const SEVERITY_EMOJI: Record<Severity, string> = {
  critical: "🔴",
  high: "🟠",
  medium: "🟡",
  info: "🔵",
};

/**
 * Safe triage: if the LLM errors or times out, fall back so an SOS is NEVER lost
 * (§20.8). SOS/panic defaults to critical; anything else to high. We still persist
 * and still alert — a human decides, not a failed API call.
 */
async function safeTriage(input: Parameters<typeof triageIncident>[0]): Promise<TriageResult> {
  try {
    return await triageIncident(input);
  } catch {
    const critical = input.type === "sos" || input.type === "accident";
    return {
      severity: critical ? "critical" : "high",
      summary: input.message,
      action: "AI triage unavailable — manual review needed.",
      isLikelyFalseAlarm: false,
      confidence: 0,
    };
  }
}

/** A Google Maps link for a coordinate, used in the alert meta. */
export function mapsLink(lat: number, lng: number): string {
  return `https://maps.google.com/?q=${lat},${lng}`;
}

/**
 * Best-effort reporter identity + ride context for the alert (§20.8): resolves WHO raised
 * the incident and WHICH ride/driver it concerns, so security can act. MUST NOT throw — a
 * failed lookup can never sink an SOS; we alert with whatever we resolved (or just the uid).
 */
async function resolveContext(
  reporterUid: string,
  rideId?: string,
): Promise<{ reporterName?: string; reporterRole?: string; driverPlate?: string; route?: string }> {
  const out: { reporterName?: string; reporterRole?: string; driverPlate?: string; route?: string } = {};
  try {
    const db = adminDb();
    const u = (await db.collection("users").doc(reporterUid).get()).data();
    if (u) {
      if (typeof u.name === "string") out.reporterName = u.name;
      if (typeof u.role === "string") out.reporterRole = u.role;
    }
    if (!out.reporterRole && (await db.collection("drivers").doc(reporterUid).get()).exists) {
      out.reporterRole = "driver";
    }
    if (rideId) {
      const r = (await db.collection("rides").doc(rideId).get()).data();
      if (r) {
        out.route = `${r.fromStop} → ${r.toStop}`;
        // The ride's driver plate (useful when a rider reports their driver going off-course).
        if (typeof r.driverId === "string" && r.driverId && r.driverId !== reporterUid) {
          const drv = (await db.collection("drivers").doc(r.driverId).get()).data();
          if (typeof drv?.plate === "string") out.driverPlate = drv.plate;
        }
      }
    }
  } catch {
    // best-effort — return whatever we managed to resolve
  }
  return out;
}

export interface RaiseIncidentParams {
  reporterUid: string;
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
  const { reporterUid, type, message, location, rideId } = params;
  const now = new Date();
  const timeOfDay = now.toTimeString().slice(0, 5);

  // Triage + reporter/ride context in parallel; both are best-effort (never sink an SOS).
  const [triage, ctx] = await Promise.all([
    safeTriage({ type, message, location, timeOfDay, rideId }),
    resolveContext(reporterUid, rideId),
  ]);

  const ref = adminDb().collection("incidents").doc();
  const incident: Incident = {
    id: ref.id,
    ...(rideId ? { rideId } : {}),
    reporterUid,
    ...(ctx.reporterName ? { reporterName: ctx.reporterName } : {}),
    ...(ctx.reporterRole ? { reporterRole: ctx.reporterRole } : {}),
    type,
    severity: triage.severity,
    aiSeverity: triage.severity,
    aiSummary: triage.summary,
    location,
    status: "open",
    createdAt: now.getTime(),
  };
  await ref.set(incident);

  // Best-effort: the incident is already persisted, so a Telegram failure must not
  // sink the alert path (§20.8) — log it, still return the incidentId.
  const tag = triage.isLikelyFalseAlarm ? " (AI: possible false alarm)" : "";
  const reporter = ctx.reporterName
    ? `${ctx.reporterName}${ctx.reporterRole ? ` (${ctx.reporterRole})` : ""}`
    : reporterUid;
  await sendTelegramAlert({
    title: `${SEVERITY_EMOJI[triage.severity]} ${type.toUpperCase()}${tag}`,
    severity: triage.severity,
    message: `AI: ${triage.summary} — ${triage.action}`,
    meta: {
      incident_id: ref.id,
      reporter,
      reporter_uid: reporterUid,
      ...(rideId ? { ride_id: rideId } : {}),
      ...(ctx.route ? { route: ctx.route } : {}),
      ...(ctx.driverPlate ? { driver: ctx.driverPlate } : {}),
      location,
      time: timeOfDay,
      ai_confidence: triage.confidence,
    },
  }).catch((err) => console.error("Alerta send failed (incident persisted):", err));

  return ref.id;
}
