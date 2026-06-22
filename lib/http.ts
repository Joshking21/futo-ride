/**
 * Response envelope helpers (CONVENTIONS §6).
 *
 * Success: { ok: true,  data: T }
 * Failure: { ok: false, error: string }
 *
 * `fail` maps known errors to clean messages and never leaks a stack trace,
 * secret, or raw third-party error to the client.
 *
 * TODO: implement ok(data, status=200) and fail(err, status=400).
 */

export {};
