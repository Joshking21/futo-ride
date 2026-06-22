import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

/**
 * Returns the singleton Admin app, initializing it on first use. Credentials
 * come from server-only env vars; the private key is stored with escaped
 * newlines and restored here.
 */
function getAdminApp(): App {
  const existing = getApps();
  if (existing.length > 0) return existing[0];

  const projectId = requireEnv("FIREBASE_ADMIN_PROJECT_ID");
  const clientEmail = requireEnv("FIREBASE_ADMIN_CLIENT_EMAIL");
  const privateKey = requireEnv("FIREBASE_ADMIN_PRIVATE_KEY").replace(
    /\\n/g,
    "\n",
  );

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

/** Admin Auth instance for token verification. */
export function adminAuth(): Auth {
  return getAuth(getAdminApp());
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}
