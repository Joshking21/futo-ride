import { ZodError } from "zod";

export type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/** Error carrying an HTTP status, thrown by handlers and mapped by `fail`. */
export class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/** Standard success envelope. */
export function ok<T>(data: T, status = 200): Response {
  return Response.json({ ok: true, data } satisfies ApiResponse<T>, { status });
}

/**
 * Standard failure envelope. Maps known errors to clean client messages and
 * never leaks a stack trace, secret, or raw third-party error. Unknown errors
 * are logged server-side and returned as a generic 500.
 */
export function fail(err: unknown, status = 400): Response {
  if (err instanceof HttpError) {
    return Response.json(
      { ok: false, error: err.message } satisfies ApiResponse<never>,
      { status: err.status },
    );
  }

  if (err instanceof ZodError) {
    const first = err.issues[0];
    const path = first.path.join(".");
    const message = path ? `${path}: ${first.message}` : first.message;
    return Response.json(
      { ok: false, error: message } satisfies ApiResponse<never>,
      { status: 400 },
    );
  }

  console.error("Unhandled error:", err);
  return Response.json(
    { ok: false, error: "Something went wrong" } satisfies ApiResponse<never>,
    { status: status === 400 ? 500 : status },
  );
}
