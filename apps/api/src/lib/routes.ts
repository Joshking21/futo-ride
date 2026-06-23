/**
 * Bus routes — each an ordered list of stop ids ending in town (PROJECT_PLAN §7).
 * Used by the transit-tracker (no dispatch) for ETA-to-stop.
 *
 * TODO: fill in real routes (a "still to confirm" item, §17). References stop
 * ids from ./campus-stops.
 */

export const BUS_ROUTES = [
  // { id: "town-a", name: "Town Route A", stopIds: ["gate", /* ... */] },
] as const;
