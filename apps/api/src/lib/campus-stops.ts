/** Hardcoded campus buildings/stops — replace with verified coords (PROJECT_PLAN §17). */
export const CAMPUS_STOPS = [
  { id: "seet", name: "SEET", lat: 5.387, lng: 6.998 },
  { id: "library", name: "Main Library", lat: 5.3875, lng: 6.9972 },
  { id: "gate", name: "Main Gate", lat: 5.3858, lng: 6.999 },
  { id: "town", name: "Town (Owerri)", lat: 5.4833, lng: 7.0333 }, // placeholder — verify coords
] as const;
