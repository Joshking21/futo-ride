/**
 * Shared data types — the contract both backend and frontend import.
 *
 * Firestore is schemaless (PROJECT_PLAN §14); these types + Zod enforce shape.
 * Filled in per-feature as work is scoped. Shapes below mirror PROJECT_PLAN §14
 * but are intentionally left as TODOs — do not invent fields ahead of a feature.
 */

// TODO: define as features are scoped. Sketch from PROJECT_PLAN §14:
// User | Driver | Stop | Route | Ride | Incident | Payment | Rating

export {};
