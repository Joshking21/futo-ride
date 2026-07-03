/**
 * Bus route helpers. A route is an ordered list of stop ids ending in town
 * (PROJECT_PLAN §7). Given a live bus position we compute the ETA to each
 * remaining stop along the route. Live positions are read by the app from RTDB
 * and passed in — this layer is stateless geo math only.
 */

import { CAMPUS_STOPS } from "./campus-stops.js";
import { BUS_ROUTES } from "./routes.js";
import { distanceKm, etaMinutes, isWithinRadius } from "./geo.js";

const BUS_SPEED_KMH = 25;

/** A bus is "near" a stop within this radius — triggers the proximity ping. */
export const PROXIMITY_RADIUS_KM = 0.4;

type LatLng = { lat: number; lng: number };

export type Stop = { id: string; name: string; lat: number; lng: number };
export type StopEta = Stop & { distKm: number; etaMin: number };

/** A route resolved to its full ordered stop objects (skips unknown ids). */
export function resolveRoute(routeId: string): { id: string; name: string; stops: Stop[] } | null {
  const route = BUS_ROUTES.find((r) => r.id === routeId);
  if (!route) return null;

  const stops: Stop[] = [];
  for (const stopId of route.stopIds) {
    const stop = CAMPUS_STOPS.find((s) => s.id === stopId);
    if (stop) stops.push({ ...stop });
  }
  return { id: route.id, name: route.name, stops };
}

/**
 * ETA from a live bus position to each stop ahead of it on the route. The bus's
 * progress is taken as the nearest stop on the route; stops at or before that
 * index are considered passed and omitted.
 */
export function etaAlongRoute(routeId: string, busPos: LatLng): StopEta[] | null {
  const resolved = resolveRoute(routeId);
  if (!resolved || resolved.stops.length === 0) return null;

  let nearestIdx = 0;
  let nearestDist = Infinity;
  resolved.stops.forEach((stop, i) => {
    const d = distanceKm(busPos, stop);
    if (d < nearestDist) {
      nearestDist = d;
      nearestIdx = i;
    }
  });

  // Cumulative distance from the bus, through each upcoming stop, to the target.
  const ahead: StopEta[] = [];
  let cursor: LatLng = busPos;
  let cumKm = 0;
  for (let i = nearestIdx; i < resolved.stops.length; i++) {
    const stop = resolved.stops[i];
    cumKm += distanceKm(cursor, stop);
    ahead.push({ ...stop, distKm: cumKm, etaMin: etaMinutes(cumKm, BUS_SPEED_KMH) });
    cursor = stop;
  }
  return ahead;
}

/** True if the bus is within PROXIMITY_RADIUS_KM of the given stop on the route. */
export function isBusNearStop(routeId: string, stopId: string, busPos: LatLng): boolean {
  const resolved = resolveRoute(routeId);
  const stop = resolved?.stops.find((s) => s.id === stopId);
  if (!stop) return false;
  return isWithinRadius(busPos, stop, PROXIMITY_RADIUS_KM);
}
