/**
 * Creates a test Firebase user + gets a real ID token for Postman testing.
 *
 * Usage:  npx tsx --env-file=../../.env.local src/scripts/get-test-token.ts [rider|driver]
 *
 * What it does:
 *   1. Creates (or reuses) a test user in Firebase Auth via the Admin SDK
 *   2. Creates a custom token for that user (Admin SDK)
 *   3. Exchanges the custom token for a real ID token (Firebase REST API)
 *   4. Prints the token — paste it into Postman as: Authorization: Bearer <token>
 *
 * Requires NEXT_PUBLIC_FIREBASE_API_KEY in .env.local (your Firebase Web API Key).
 */

import { adminAuth } from "../lib/firebase-admin.js";
import { getFirestore } from "firebase-admin/firestore";
import { getAdminApp } from "../lib/firebase-admin.js";

const ROLE = (process.argv[2] as "rider" | "rider2" | "driver") ?? "rider";

const TEST_USERS = {
  rider: { email: "test-rider@futo-ride.test", name: "Test Rider", password: "testpass123" },
  rider2: { email: "test-rider2@futo-ride.test", name: "Test Rider Two", password: "testpass123" },
  driver: { email: "test-driver@futo-ride.test", name: "Test Driver", password: "testpass123" },
};

const user = TEST_USERS[ROLE];
const webApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

if (!webApiKey) {
  console.error("\n❌ Missing NEXT_PUBLIC_FIREBASE_API_KEY in .env.local");
  console.error("   Go to Firebase Console → Project Settings → General → Web API Key");
  console.error("   It starts with AIzaSy...\n");
  process.exit(1);
}

async function getOrCreateUser() {
  const auth = adminAuth();
  try {
    return await auth.getUserByEmail(user.email);
  } catch {
    console.log(`Creating ${ROLE} user: ${user.email}`);
    return await auth.createUser({
      email: user.email,
      password: user.password,
      displayName: user.name,
    });
  }
}

async function ensureFirestoreDoc(uid: string) {
  const db = getFirestore(getAdminApp());

  // Create the user doc (the mobile app normally does this on signup).
  // rider2 is just a second rider account for pooling tests — its role is "rider".
  const role = ROLE === "driver" ? "driver" : "rider";
  const userRef = db.collection("users").doc(uid);
  if (!(await userRef.get()).exists) {
    await userRef.set({ id: uid, name: user.name, email: user.email, role });
    console.log(`Created users/${uid} doc (role: ${role})`);
  }

  // If driver, also create the driver doc
  if (ROLE === "driver") {
    const driverRef = db.collection("drivers").doc(uid);
    if (!(await driverRef.get()).exists) {
      await driverRef.set({
        id: uid,
        name: user.name,
        plate: "KEKE-TEST-001",
        vehicleType: "keke",
        online: false,
        currentLat: 5.387,
        currentLng: 6.998,
        capacity: 4,
        seatsTaken: 0,
      });
      console.log(`Created drivers/${uid} doc (vehicleType: keke)`);
    }
  }
}

async function exchangeCustomTokenForIdToken(customToken: string): Promise<string> {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${webApiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: customToken, returnSecureToken: true }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed (${res.status}): ${err}`);
  }

  const json = (await res.json()) as { idToken: string };
  return json.idToken;
}

async function main() {
  console.log(`\n🔑 Getting test token for: ${ROLE}\n`);

  const fbUser = await getOrCreateUser();
  console.log(`UID: ${fbUser.uid}`);

  await ensureFirestoreDoc(fbUser.uid);

  const customToken = await adminAuth().createCustomToken(fbUser.uid);
  const idToken = await exchangeCustomTokenForIdToken(customToken);

  console.log(`\n✅ ID Token (expires in 1 hour):\n`);
  console.log(idToken);
  console.log(`\n📋 For Postman, set this header:`);
  console.log(`   Authorization: Bearer ${idToken.slice(0, 30)}...`);
  console.log(`\n   UID:   ${fbUser.uid}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Role:  ${ROLE}\n`);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
