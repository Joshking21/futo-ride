/**
 * Focused test for the payment-TTL sweep (§20.1). Boot the server with a short
 * PAYMENT_WINDOW_MS, book an unpaid ride, let it lapse, trigger the lazy sweep, and
 * assert the ride went `expired` and the seat was freed. Cleans up after itself.
 *
 *   PAYMENT_WINDOW_MS=1500 DRIVER_WHITELIST=test-driver@futo-ride.test PORT=4022 \
 *     npx tsx --env-file=../../.env.local src/server.ts   (in one shell)
 *   E2E_BASE=http://localhost:4022 npx tsx --env-file=../../.env.local src/scripts/expiry-test.ts
 */

import { adminAuth, getAdminApp } from "../lib/firebase-admin.js";
import { getFirestore } from "firebase-admin/firestore";

const BASE = process.env.E2E_BASE ?? "http://localhost:4022";
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY!;
const db = getFirestore(getAdminApp());
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- test script
type Any = any;

let pass = 0,
  fail = 0;
function check(name: string, cond: boolean, detail?: Any) {
  cond ? pass++ : fail++;
  console.log(`  ${cond ? "✅" : "❌"} ${name}` + (!cond && detail !== undefined ? ` → ${JSON.stringify(detail)}` : ""));
}

async function mint(email: string, name: string) {
  const auth = adminAuth();
  let u;
  try {
    u = await auth.getUserByEmail(email);
  } catch {
    u = await auth.createUser({ email, password: "testpass123", displayName: name });
  }
  await db.collection("users").doc(u.uid).set({ id: u.uid, name, email, role: "rider" }, { merge: true });
  const ct = await auth.createCustomToken(u.uid);
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: ct, returnSecureToken: true }),
  });
  return { token: ((await res.json()) as Any).idToken as string, uid: u.uid };
}

async function call(method: string, path: string, token?: string, body?: Any) {
  const res = await fetch(`${BASE}${path}`, {
    method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = (await res.json().catch(() => ({}))) as Any;
  return { status: res.status, data: json.data, error: json.error };
}

async function main() {
  console.log(`\n⌛ Expiry-sweep test against ${BASE}\n`);
  const rider = await mint("test-rider@futo-ride.test", "Test Rider");
  const driver = await mint("test-driver@futo-ride.test", "Test Driver");

  await db.collection("drivers").doc(driver.uid).delete().catch(() => {});
  const old = await db.collection("rides").where("riderId", "==", rider.uid).get();
  await Promise.all(old.docs.map((d) => d.ref.delete()));

  await call("POST", "/drivers/register", driver.token, { name: "Test Driver", plate: "KEKE-TEST-001" });
  await call("POST", "/drivers/online", driver.token, { online: true, lat: 5.387, lng: 6.998 });

  const book = await call("POST", "/rides", rider.token, { fromStop: "seet", toStop: "town", seats: 1, payMethod: "naira" });
  const rideId = book.data?.rideId;
  check("booked, keke seat taken (seatsTaken 1)", book.data?.seatsTaken === 1, book);

  console.log("  …waiting for the hold to lapse…");
  await new Promise((r) => setTimeout(r, 2500));

  // Trigger the lazy sweep via a second booking attempt by the same rider.
  await call("POST", "/rides", rider.token, { fromStop: "seet", toStop: "town", seats: 1, payMethod: "naira" });

  const rideSnap = await db.collection("rides").doc(rideId).get();
  const driverSnap = await db.collection("drivers").doc(driver.uid).get();
  check("lapsed ride marked `expired`", rideSnap.data()?.status === "expired", rideSnap.data()?.status);
  check("expired ride tagged cancelledBy=system", rideSnap.data()?.cancelledBy === "system", rideSnap.data()?.cancelledBy);
  // seat from the expired ride is freed (the 2nd booking re-took 1 → net 1, or 0 if it stranded).
  check("driver seat count is sane (≤1 after sweep)", (driverSnap.data()?.seatsTaken ?? 0) <= 1, driverSnap.data()?.seatsTaken);

  // Cleanup.
  const mine = await db.collection("rides").where("riderId", "==", rider.uid).get();
  await Promise.all(mine.docs.map((d) => d.ref.delete()));
  await db.collection("drivers").doc(driver.uid).delete().catch(() => {});
  await db.collection("users").doc(rider.uid).delete().catch(() => {});
  await db.collection("users").doc(driver.uid).delete().catch(() => {});
  const inc = await db.collection("incidents").where("riderId", "==", rider.uid).get();
  await Promise.all(inc.docs.map((d) => d.ref.delete()));

  console.log(`\n${fail === 0 ? "🎉 PASSED" : "⚠️ FAILED"} — ${pass} passed, ${fail} failed\n`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error("crashed:", e); process.exit(1); });
