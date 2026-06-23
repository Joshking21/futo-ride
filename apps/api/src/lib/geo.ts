import * as turf from "@turf/turf";

type LatLng = { lat: number; lng: number };

/** Great-circle distance in km. ⚠️ Turf uses [lng, lat] not [lat, lng]. */
export function distanceKm(a: LatLng, b: LatLng): number {
  return turf.distance(
    turf.point([a.lng, a.lat]),
    turf.point([b.lng, b.lat]),
    { units: "kilometers" },
  );
}

/** Estimated travel time in minutes. */
export function etaMinutes(km: number, speedKmh = 20): number {
  return (km / speedKmh) * 60;
}

/** Finds the nearest item to a point, with distance and ETA. */
export function findNearest<T extends LatLng>(
  point: LatLng,
  items: readonly T[],
  speedKmh = 20,
): (T & { distKm: number; etaMin: number }) | null {
  if (items.length === 0) return null;

  let bestItem = items[0];
  let bestDist = Infinity;

  for (const item of items) {
    const d = distanceKm(point, item);
    if (d < bestDist) {
      bestItem = item;
      bestDist = d;
    }
  }

  return { ...bestItem, distKm: bestDist, etaMin: etaMinutes(bestDist, speedKmh) };
}

/** True if point is within radiusKm of center (arrival geofence). */
export function isWithinRadius(point: LatLng, center: LatLng, radiusKm: number): boolean {
  return distanceKm(point, center) <= radiusKm;
}
