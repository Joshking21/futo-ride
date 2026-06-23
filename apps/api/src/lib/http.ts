import { ZodError } from "zod";

export type ApiSuccess<T> = { ok: true; data: T };
export type ApiError = { ok: false; error: string };

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
export function ok<T>(data: T): ApiSuccess<T> {
  return { ok: true, data };
}

/** Maps errors to status + clean message. Used by the global error handler. */
export function mapError(err: unknown): { status: number; body: ApiError } {
  if (err instanceof HttpError) {
    return { status: err.status, body: { ok: false, error: err.message } };
  }

  if (err instanceof ZodError) {
    const first = err.issues[0];
    const path = first.path.join(".");
    const message = path ? `${path}: ${first.message}` : first.message;
    return { status: 400, body: { ok: false, error: message } };
  }

  console.error("Unhandled error:", err);
  return { status: 500, body: { ok: false, error: "Something went wrong" } };
}
