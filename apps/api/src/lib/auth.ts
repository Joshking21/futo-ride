import { adminAuth } from "./firebase-admin";
import { HttpError } from "./http";

/** The trusted identity resolved from a verified Firebase ID token. */
export type AuthUser = {
  uid: string;
  email?: string;
};

/**
 * Verifies the request's Firebase ID token and returns the trusted identity.
 * Reads `Authorization: Bearer <idToken>` and verifies it with the Admin SDK.
 * The returned uid is the source of identity — never trust an id from the body.
 *
 * @throws HttpError 401 when the token is missing, malformed, or invalid.
 */
export async function verifyRequest(req: Request): Promise<AuthUser> {
  const header = req.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw new HttpError("Missing authentication token", 401);

  try {
    const decoded = await adminAuth().verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email };
  } catch {
    throw new HttpError("Invalid or expired token", 401);
  }
}
