/**
 * Typed API client the frontend imports — the wiring layer (AGENTS §7).
 *
 * Thin typed fetch wrappers over /app/api routes, sharing /types as the
 * contract. Frontend calls e.g. api.bookRide(input) — never raw scattered
 * fetch, never hand-written URLs.
 *
 * TODO: add one typed wrapper per endpoint as routes land. Keep in sync with
 * /types and docs/API.md (the contract trio).
 */

export {};
