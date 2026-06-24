/** AI incident triage — event → severity + summary + action (PROJECT_PLAN §11). */

import { GoogleGenAI } from "@google/genai";
import type { Severity } from "../types/index.js";

export interface TriageInput {
  type: string;
  message: string;
  location?: string;
  timeOfDay: string;
  rideId?: string;
  routeDeviationMeters?: number;
}

export interface TriageResult {
  severity: Severity;
  summary: string;
  action: string;
  isLikelyFalseAlarm: boolean;
  confidence: number;
}

const SYSTEM_PROMPT = `You are a campus safety triage AI for FUTO. Given an incident report, respond with ONLY a JSON object.
Rules: night (after 19:00) escalates one level. Off-route + unresponsive = critical. Single SOS no context = high. Immediate cancel + no movement = likely false alarm.`;

/** Triages an incident via LLM using the official Google GenAI SDK. */
export async function triageIncident(input: TriageInput): Promise<TriageResult> {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) throw new Error("Missing LLM_API_KEY");

  const ai = new GoogleGenAI({ apiKey });
  const model = process.env.LLM_MODEL ?? "gemini-3.5-flash";

  const userPrompt = [
    `Type: ${input.type}`,
    `Message: ${input.message}`,
    `Time: ${input.timeOfDay}`,
    input.location && `Location: ${input.location}`,
    input.rideId && `Ride: ${input.rideId}`,
    input.routeDeviationMeters && `Route deviation: ${input.routeDeviationMeters}m`,
  ].filter(Boolean).join("\n");

  const response = await ai.models.generateContent({
    model,
    contents: userPrompt,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          severity: {
            type: "STRING",
            description: "Must be 'critical', 'high', 'medium', or 'info'",
          },
          summary: {
            type: "STRING",
            description: "One actionable sentence",
          },
          action: {
            type: "STRING",
            description: "Recommended response",
          },
          isLikelyFalseAlarm: {
            type: "BOOLEAN",
          },
          confidence: {
            type: "NUMBER",
            description: "0.0 to 1.0",
          },
        },
        required: ["severity", "summary", "action", "isLikelyFalseAlarm", "confidence"],
      },
    },
  });

  if (!response.text) {
    throw new Error("LLM API error: No response text generated");
  }

  return JSON.parse(response.text) as TriageResult;
}
