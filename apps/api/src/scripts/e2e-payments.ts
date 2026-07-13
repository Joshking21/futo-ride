/**
 * Payments endpoint test — TIER 1 (no Partna account needed).
 * Covers every /payments/* path that is decided BEFORE the Partna network edge:
 * auth (401), ownership (403), ride-state (409), not-found (404), webhook bad-signature
 * (401), and the graceful 500 when the Partna edge is reached without credentials.
 *
 * The settlement round-trip (mock-deposit → real webhook → ride PAID) and the webhook
 * SIGNATURE check are TIER 2 — they need Partna staging creds and are intentionally not
 * run here (they'd 500 on missing creds). When PARTNA_API_KEY is set, extend this file.
 *
 * Usage (server on E2E_BASE, no Partna creds required):
 *   E2E_BASE=http://localhost:4021 DRIVER_WHITELIST=test-driver@futo-ride.test \
 *     npx tsx --env-file=../../.env.local src/scripts/e2e-payments.ts
 */

import { adminAuth, getAdminApp } from "../lib/firebase-admin.js";
import { getFirestore } from "firebase-admin/firestore";

const BASE = process.env.E2E_BASE ?? "http://localhost:4021";
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY!;
const HAS_PARTNA = !!process.env.PARTNA_API_KEY;
const db = getFirestore(getAdminApp());

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- test script, dynamic payloads
type Any = any;

let pass = 0;
let fail = 0;
function check(name: string, cond: boolean, detail?: Any) {
  if (cond) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name}` + (detail !== undefined ? ` → ${JSON.stringify(detail)}` : "")); }
}

async function mint(email: string, name: string) {
  const auth = adminAuth();
  let user;
  try { user = await auth.getUserByEmail(email); }
  catch { user = await auth.createUser({ email, password: "testpass123", displayName: name }); }
  await db.collection("users").doc(user.uid).set({ id: user.uid, name, email, role: "rider" }, { merge: true });
  const customToken = await auth.createCustomToken(user.uid);
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: customToken, returnSecureToken: true }) },
  );
  const json = (await res.json()) as { idToken: string };
  return { token: json.idToken, uid: user.uid };
}

async function call(method: string, path: string, token?: string, body?: Any) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = (await res.json().catch(() => ({}))) as Any;
  return { status: res.status, data: json.data, error: json.error };
}

async function main() {
  console.log(`\n🧪 PAYMENTS E2E (tier 1) against ${BASE}`);
  console.log(HAS_PARTNA ? "   PARTNA_API_KEY present — but tier-2 settlement is not automated here.\n" : "   No Partna creds — testing pre-edge logic + graceful failures.\n");

  const rider = await mint("test-rider@futo-ride.test", "Test Rider");
  const rider2 = await mint("test-rider2@futo-ride.test", "Test Rider Two");
  const driver = await mint("test-driver@futo-ride.test", "Test Driver");

  const riderUids = [rider.uid, rider2.uid];
  for (const uid of riderUids) {
    const snap = await db.collection("rides").where("riderId", "==", uid).get();
    await Promise.all(snap.docs.map((d) => d.ref.delete()));
  }
  await db.collection("drivers").doc(driver.uid).delete().catch(() => {});
  await call("POST", "/drivers/register", driver.token, { name: "Test Driver", plate: "KEKE-TEST-001" });
  await call("POST", "/drivers/online", driver.token, { online: true, lat: 5.387, lng: 6.998 });

  console.log("── Auth (401) ──");
  check("init without token → 401", (await call("POST", "/payments/init", undefined, { rideId: "x" })).status === 401);
  check("verify without token → 401", (await call("POST", "/payments/verify", undefined, { reference: "x" })).status === 401);
  check("mock-deposit without token → 401", (await call("POST", "/payments/mock-deposit", undefined, { rideId: "x" })).status === 401);

  console.log("\n── /payments/init pre-edge gates ──");
  const init404 = await call("POST", "/payments/init", rider.token, { rideId: "does-not-exist" });
  check("init unknown ride → 404", init404.status === 404, init404);

  // A payable (assigned) ride for the rider.
  const book = await call("POST", "/rides", rider.token, { fromStop: "seet", toStop: "town", seats: 1, payMethod: "naira" });
  const payable = book.data?.rideId as string;
  check("book matched (payable) ride", book.status === 200 && book.data?.stranded === false, book);

  const init403 = await call("POST", "/payments/init", rider2.token, { rideId: payable });
  check("init on another rider's ride → 403", init403.status === 403, init403);

  // A non-payable (stranded / requested) ride: rider2 on a different lane → keke busy → stranded.
  const strand = await call("POST", "/rides", rider2.token, { fromStop: "seet", toStop: "gate", seats: 1, payMethod: "naira" });
  const notPayable = strand.data?.rideId as string;
  check("book stranded (requested) ride", strand.status === 200 && strand.data?.stranded === true, strand);
  const init409 = await call("POST", "/payments/init", rider2.token, { rideId: notPayable });
  check("init on stranded/requested ride → 409 not payable", init409.status === 409, init409);

  const initEdge = await call("POST", "/payments/init", rider.token, { rideId: payable });
  if (HAS_PARTNA) {
    check("init (creds present) → 200 checkoutUrl + reference", initEdge.status === 200 && typeof initEdge.data?.checkoutUrl === "string" && initEdge.data?.reference === `futoride-${payable}`, initEdge);
  } else {
    check("init reaches Partna edge w/o creds → 500 (graceful)", initEdge.status === 500, initEdge);
  }

  console.log("\n── /payments/verify pre-edge gates ──");
  const verify404 = await call("POST", "/payments/verify", rider.token, { reference: "futoride-does-not-exist" });
  check("verify unknown reference → 404", verify404.status === 404, verify404);

  // Seed a payment doc owned by rider (via ride Q) to exercise the ownership branch.
  const qRef = db.collection("rides").doc();
  await qRef.set({ id: qRef.id, riderId: rider.uid, driverId: "", fromStop: "seet", toStop: "town", status: "assigned", fare: 15000, priorityFee: 0, payMethod: "naira", qrToken: "", completionPin: "", createdAt: Date.now(), seats: 1 });
  const seededRef = `futoride-${qRef.id}`;
  await db.collection("payments").doc(qRef.id).set({ id: qRef.id, rideId: qRef.id, method: "naira", amount: 15000, status: "pending", ref: seededRef });

  const verify403 = await call("POST", "/payments/verify", rider2.token, { reference: seededRef });
  check("verify another rider's payment → 403", verify403.status === 403, verify403);

  console.log("\n── /payments/webhook signature gate ──");
  const whBad = await call("POST", "/payments/webhook", undefined, { event: "onramp", data: { rampReference: seededRef }, signature: "not-a-real-signature" });
  check("webhook bad signature → 401", whBad.status === 401, whBad);
  const whNoSig = await call("POST", "/payments/webhook", undefined, { event: "onramp", data: { rampReference: seededRef } });
  check("webhook missing signature → 401", whNoSig.status === 401, whNoSig);

  console.log("\n── /payments/mock-deposit pre-edge gates ──");
  const md404 = await call("POST", "/payments/mock-deposit", rider.token, { rideId: "does-not-exist" });
  check("mock-deposit unknown ride → 404", md404.status === 404, md404);
  const md403 = await call("POST", "/payments/mock-deposit", rider2.token, { rideId: payable });
  check("mock-deposit on another rider's ride → 403", md403.status === 403, md403);

  console.log("\n── Cleanup ──");
  for (const uid of riderUids) {
    const snap = await db.collection("rides").where("riderId", "==", uid).get();
    await Promise.all(snap.docs.map((d) => d.ref.delete()));
    await db.collection("users").doc(uid).delete().catch(() => {});
  }
  await qRef.delete().catch(() => {});
  await db.collection("payments").doc(qRef.id).delete().catch(() => {});
  if (HAS_PARTNA) await db.collection("payments").doc(payable).delete().catch(() => {});
  await db.collection("drivers").doc(driver.uid).delete().catch(() => {});
  await db.collection("users").doc(driver.uid).delete().catch(() => {});
  console.log("  cleaned rides, payments, drivers, users");

  console.log(`\n${fail === 0 ? "🎉 ALL PASSED" : "⚠️  SOME FAILED"} — ${pass} passed, ${fail} failed`);
  if (!HAS_PARTNA) console.log("   (Tier 2 — settlement + webhook signature — pending Partna staging creds.)\n");
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((err) => { console.error("PAYMENTS e2e crashed:", err); process.exit(1); });
