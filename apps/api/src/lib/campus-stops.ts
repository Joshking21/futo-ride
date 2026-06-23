/**
 * Hardcoded campus buildings/stops (PROJECT_PLAN §7).
 *
 * Replace placeholders with REAL coords: Google Maps → right-click → click the
 * `lat, lng` to copy. (Real coordinates are a "still to confirm" item, §17.)
 */

export const CAMPUS_STOPS = [
  // TODO: replace placeholder coordinates with verified campus values.
  { id: "seet", name: "SEET", lat: 5.387, lng: 6.998 },
  { id: "library", name: "Main Library", lat: 5.3875, lng: 6.9972 },
  { id: "gate", name: "Main Gate", lat: 5.3858, lng: 6.999 },
] as const;
