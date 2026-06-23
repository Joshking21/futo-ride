import type { FastifyRequest } from "fastify";
import { adminAuth } from "./firebase-admin.js";
import { HttpError } from "./http.js";

export type AuthUser = { uid: string; email?: string };

/** Verifies the Firebase ID token and returns the trusted uid. */
export async function verifyRequest(req: FastifyRequest): Promise<AuthUser> {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw new HttpError("Missing authentication token", 401);

  try {
    const decoded = await adminAuth().verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email };
  } catch {
    throw new HttpError("Invalid or expired token", 401);
  }
}
