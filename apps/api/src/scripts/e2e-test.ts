/**
 * End-to-end flow test (temporary — for the v6 hardening review).
 * Mints real Firebase ID tokens for a rider, a second rider, and a driver, then
 * drives both POVs against a running backend and asserts each behaviour. Cleans up
 * all Firestore docs it creates at the end.
 *
 * Usage (server must be running on E2E_BASE):
 *   E2E_BASE=http://localhost:4021 npx tsx --env-file=../../.env.local src/scripts/e2e-test.ts
 */

import { adminAuth, getAdminApp } from "../lib/firebase-admin.js";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const BASE = process.env.E2E_BASE ?? "http://localhost:4021";
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY!;
const db = getFirestore(getAdminApp());

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- test script, dynamic payloads
type Any = any;

let pass = 0;
let fail = 0;
const created = { rideIds: new Set<string>(), riderUids: [] as string[], driverUid: "" };

function check(name: string, cond: boolean, detail?: Any) {
  if (cond) {
    pass++;
    console.log(`  ✅ ${name}`);
  } else {
    fail++;
    console.log(`  ❌ ${name}` + (detail !== undefined ? ` → ${JSON.stringify(detail)}` : ""));
  }
}

async function mintToken(email: string, name: string): Promise<{ token: string; uid: string }> {
  const auth = adminAuth();
  let user;
  try {
    user = await auth.getUserByEmail(email);
  } catch {
    user = await auth.createUser({ email, password: "testpass123", displayName: name });
  }
  await db.collection("users").doc(user.uid).set({ id: user.uid, name, email, role: "rider" }, { merge: true });
  const customToken = await auth.createCustomToken(user.uid);
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: customToken, returnSecureToken: true }) },
  );
  const json = (await res.json()) as { idToken: string };
  return { token: json.idToken, uid: user.uid };
}

async function call(method: string, path: string, token?: string, body?: Any): Promise<{ status: number; data: Any; error?: string }> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = (await res.json().catch(() => ({}))) as Any;
  return { status: res.status, data: json.data, error: json.error };
}

async function main() {
  console.log(`\n🧪 E2E against ${BASE}\n`);

  console.log("→ Minting tokens…");
  const rider = await mintToken("test-rider@futo-ride.test", "Test Rider");
  const rider2 = await mintToken("test-rider2@futo-ride.test", "Test Rider Two");
  const driver = await mintToken("test-driver@futo-ride.test", "Test Driver");
  created.riderUids = [rider.uid, rider2.uid];
  created.driverUid = driver.uid;

  // Fresh start: clear any leftover state from a prior run.
  await db.collection("drivers").doc(driver.uid).delete().catch(() => {});
  for (const uid of [rider.uid, rider2.uid]) {
    const snap = await db.collection("rides").where("riderId", "==", uid).get();
    await Promise.all(snap.docs.map((d) => d.ref.delete()));
  }

  console.log("\n── DRIVER POV ──");
  const reg = await call("POST", "/drivers/register", driver.token, { name: "Test Driver", plate: "KEKE-TEST-001" });
  check("register (whitelisted) → 200 keke/cap4", reg.status === 200 && reg.data?.vehicleType === "keke" && reg.data?.capacity === 4, reg);

  const online = await call("POST", "/drivers/online", driver.token, { online: true, lat: 5.387, lng: 6.998 });
  check("go online → 200", online.status === 200 && online.data?.online === true, online);

  const loc = await call("POST", "/drivers/location", driver.token, { lat: 5.387, lng: 6.998 });
  check("location heartbeat → 200", loc.status === 200, loc);

  console.log("\n── RIDER POV: booking ──");
  const stops = await call("GET", "/stops");
  check("GET /stops has seet-complex+futo-bus-park", Array.isArray(stops.data?.stops) && stops.data.stops.some((s: Any) => s.id === "seet-complex") && stops.data.stops.some((s: Any) => s.id === "futo-bus-park"), stops.status);

  const surge = await call("GET", "/surge/seet-complex");
  check("GET /surge/seet-complex → off", surge.status === 200 && surge.data?.surge === "off", surge);

  const book1 = await call("POST", "/rides", rider.token, { fromStop: "seet-complex", toStop: "futo-bus-park", seats: 1, payMethod: "naira" });
  const ride1 = book1.data?.rideId;
  if (ride1) created.rideIds.add(ride1);
  check("book seet-complex→bus-park → matched, not stranded, has expiresAt", book1.status === 200 && book1.data?.stranded === false && book1.data?.driverId === driver.uid && typeof book1.data?.expiresAt === "number", book1);
  check("fare = 15000 kobo (1 seat)", book1.data?.fare === 15000, book1.data?.fare);

  const book1b = await call("POST", "/rides", rider.token, { fromStop: "seet-complex", toStop: "futo-bus-park", seats: 1, payMethod: "naira" });
  check("second booking blocked → 409 one-active-ride", book1b.status === 409, book1b);

  console.log("\n── Fix #2: driver can't advance unpaid; completion gates ──");
  const advUnpaid = await call("POST", `/rides/${ride1}/status`, driver.token, { status: "arriving" });
  check("status arriving while UNPAID → 402", advUnpaid.status === 402, advUnpaid);

  const compUnstarted = await call("POST", `/rides/${ride1}/complete`, rider.token, { pin: "000000" });
  check("complete before started → 409", compUnstarted.status === 409, compUnstarted);

  // Simulate a confirmed Partna onramp (can't drive the hosted checkout headlessly).
  await db.collection("rides").doc(ride1).set({ paymentStatus: "PAID", expiresAt: FieldValue.delete() }, { merge: true });
  console.log("  (marked ride PAID out-of-band)");

  console.log("\n── Trip advance + QR/PIN completion ──");
  const arr = await call("POST", `/rides/${ride1}/status`, driver.token, { status: "arriving" });
  check("status arriving after paid → 200, affected 1", arr.status === 200 && arr.data?.affected === 1, arr);
  const start = await call("POST", `/rides/${ride1}/status`, driver.token, { status: "started" });
  check("status started → 200, affected 1", start.status === 200 && start.data?.affected === 1, start);

  const qr = await call("GET", `/rides/${ride1}/qr`, driver.token);
  const pin = qr.data?.pin as string;
  check("driver GET qr → has qrToken + 6-digit pin", qr.status === 200 && !!qr.data?.qrToken && /^\d{6}$/.test(pin ?? ""), qr);

  const wrongPin = pin === "999999" ? "000000" : "999999";
  const badComplete = await call("POST", `/rides/${ride1}/complete`, rider.token, { pin: wrongPin });
  check("complete wrong pin → 400", badComplete.status === 400, badComplete);

  const goodComplete = await call("POST", `/rides/${ride1}/complete`, rider.token, { pin });
  check("complete correct pin → 200, fare 15000", goodComplete.status === 200 && goodComplete.data?.fare === 15000, goodComplete);

  const rate = await call("POST", `/rides/${ride1}/rate`, rider.token, { stars: 5 });
  check("rate 5★ → 200", rate.status === 200, rate);

  const earn = await call("GET", "/drivers/me/earnings", driver.token);
  // Driver keeps 95% of the seat fare; the platform takes a 5% welfare cut (§21/P2).
  // 15000 kobo fare → 14250 driver / 750 platform.
  check("driver earnings totalKobo = 14250 (95% of 15000)", earn.status === 200 && earn.data?.totalKobo === 14250, earn);

  console.log("\n── Lane pooling (from+to) ──");
  const p1 = await call("POST", "/rides", rider.token, { fromStop: "seet-complex", toStop: "futo-bus-park", seats: 1, payMethod: "naira" });
  if (p1.data?.rideId) created.rideIds.add(p1.data.rideId);
  check("rider books seet-complex→bus-park → new pool (pooled=false)", p1.status === 200 && p1.data?.pooled === false && p1.data?.seatsTaken === 1, p1);

  const p2 = await call("POST", "/rides", rider2.token, { fromStop: "seet-complex", toStop: "hostel-c", seats: 1, payMethod: "naira" });
  if (p2.data?.rideId) created.rideIds.add(p2.data.rideId);
  check("rider2 seet-complex→hostel-c (diff lane) → stranded (keke busy on other lane)", p2.status === 200 && p2.data?.stranded === true, p2);

  const cancelP2 = await call("POST", `/rides/${p2.data?.rideId}/cancel`, rider2.token);
  check("cancel stranded ride → 200", cancelP2.status === 200, cancelP2);

  const p3 = await call("POST", "/rides", rider2.token, { fromStop: "seet-complex", toStop: "futo-bus-park", seats: 1, payMethod: "naira" });
  if (p3.data?.rideId) created.rideIds.add(p3.data.rideId);
  check("rider2 seet-complex→bus-park (same lane) → JOINS (pooled=true, seatsTaken 2)", p3.status === 200 && p3.data?.pooled === true && p3.data?.driverId === driver.uid && p3.data?.seatsTaken === 2, p3);

  console.log("\n── Cleanup ──");
  for (const id of created.rideIds) {
    await db.collection("rides").doc(id).delete().catch(() => {});
    await db.collection("ratings").doc(id).delete().catch(() => {});
  }
  await db.collection("drivers").doc(driver.uid).delete().catch(() => {});
  for (const uid of created.riderUids) await db.collection("users").doc(uid).delete().catch(() => {});
  await db.collection("users").doc(driver.uid).delete().catch(() => {});
  const earns = await db.collection("earnings").where("driverId", "==", driver.uid).get();
  await Promise.all(earns.docs.map((d) => d.ref.delete()));
  for (const uid of created.riderUids) {
    const inc = await db.collection("incidents").where("reporterUid", "==", uid).get();
    await Promise.all(inc.docs.map((d) => d.ref.delete()));
  }
  console.log("  cleaned rides, ratings, driver, users, earnings, incidents");

  console.log(`\n${fail === 0 ? "🎉 ALL PASSED" : "⚠️  SOME FAILED"} — ${pass} passed, ${fail} failed\n`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("E2E crashed:", err);
  process.exit(1);
});
