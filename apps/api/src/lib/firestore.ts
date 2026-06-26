import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAdminApp } from "./firebase-admin.js";

/** Firestore instance for authoritative backend writes (reuses the Admin app singleton). */
export function adminDb(): Firestore {
  return getFirestore(getAdminApp());
}
