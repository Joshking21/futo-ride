/**
 * Full-matrix coverage test — every NON-PAYMENT endpoint's good + bad paths that
 * e2e-test.ts and e2e-extra.ts don't already assert:
 *   • /health
 *   • ride-lifecycle error edges (403 not-yours · 404 not-found · 409 closed/illegal ·
 *     complete neither/both qr+pin · rate not-completed/already-rated)
 *   • the two ride-history endpoints (+ pagination + empty + stranded driverId:null)
 *   • GET /drivers/me/rides (active) · GET /drivers/:id/rating 200 · register bad paths
 *   • charter (seats=4) + priorityFee-ignored-when-surge-off
 *   • POST /telegram/webhook (bad secret 401 · no-op 200 · valid nonce handshake 200)
 *
 * Sends NO real Alerta alerts (only 401/400 incident paths, which never reach the alert
 * leg). Cleans up every Firestore doc it creates.
 *
 * Usage (server on E2E_BASE, test drivers whitelisted):
 *   E2E_BASE=http://localhost:4021 \
 *   DRIVER_WHITELIST=test-driver@futo-ride.test,test-driver2@futo-ride.test \
 *     npx tsx --env-file=../../.env.local src/scripts/e2e-coverage.ts
 */

import { adminAuth, getAdminApp } from "../lib/firebase-admin.js";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const BASE = process.env.E2E_BASE ?? "http://localhost:4021";
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY!;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
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

async function callRaw(method: string, path: string, headers: Record<string, string>, body?: Any) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = (await res.json().catch(() => ({}))) as Any;
  return { status: res.status, data: json.data, error: json.error };
}

/** Mark a ride PAID out-of-band (we can't drive the Partna hosted checkout headlessly). */
async function markPaid(rideId: string) {
  await db.collection("rides").doc(rideId).set({ paymentStatus: "PAID", expiresAt: FieldValue.delete() }, { merge: true });
}

async function main() {
  console.log(`\n🧪 COVERAGE E2E against ${BASE}\n`);

  const rider = await mint("test-rider@futo-ride.test", "Test Rider");
  const rider2 = await mint("test-rider2@futo-ride.test", "Test Rider Two");
  const rider3 = await mint("test-rider3@futo-ride.test", "Test Rider Three");
  const driver = await mint("test-driver@futo-ride.test", "Test Driver");
  const driver2 = await mint("test-driver2@futo-ride.test", "Test Driver Two");

  const riderUids = [rider.uid, rider2.uid, rider3.uid];
  // Fresh start.
  for (const uid of [driver.uid, driver2.uid]) await db.collection("drivers").doc(uid).delete().catch(() => {});
  for (const uid of riderUids) {
    const snap = await db.collection("rides").where("riderId", "==", uid).get();
    await Promise.all(snap.docs.map((d) => d.ref.delete()));
  }

  const online = () => call("POST", "/drivers/online", driver.token, { online: true, lat: 5.387, lng: 6.998 });

  console.log("── System ──");
  const health = await call("GET", "/health");
  check("GET /health → 200 status:ok", health.status === 200 && health.data?.status === "ok", health);

  console.log("\n── Ride history: empty (fresh rider) ──");
  const emptyHist = await call("GET", "/rides/history", rider3.token);
  check("GET /rides/history (no rides) → 200 rides:[] nextCursor:null",
    emptyHist.status === 200 && Array.isArray(emptyHist.data?.rides) && emptyHist.data.rides.length === 0 && emptyHist.data?.nextCursor === null, emptyHist);
  const histNoAuth = await call("GET", "/rides/history");
  check("GET /rides/history without token → 401", histNoAuth.status === 401, histNoAuth);
  const dHistNoAuth = await call("GET", "/drivers/me/rides/history");
  check("GET /drivers/me/rides/history without token → 401", dHistNoAuth.status === 401, dHistNoAuth);

  console.log("\n── Driver register / online / withdraw bad paths ──");
  const regNotWhitelisted = await call("POST", "/drivers/register", rider.token, { name: "Nope", plate: "X-1" });
  check("register non-whitelisted user → 403", regNotWhitelisted.status === 403, regNotWhitelisted);
  const regBadBody = await call("POST", "/drivers/register", driver.token, { plate: "NO-NAME" });
  check("register missing name → 400 validation", regBadBody.status === 400, regBadBody);
  const onlineUnreg = await call("POST", "/drivers/online", driver2.token, { online: true });
  check("online as unregistered driver → 403", onlineUnreg.status === 403, onlineUnreg);
  const locNoAuth = await call("POST", "/drivers/location", undefined, { lat: 5.387, lng: 6.998 });
  check("location without token → 401", locNoAuth.status === 401, locNoAuth);
  const wNoDriver = await call("POST", "/drivers/me/withdraw", driver2.token, { amountKobo: 100, method: "wallet", walletAddress: "SoLwallet111" });
  check("withdraw with no driver doc → 404", wNoDriver.status === 404, wNoDriver);

  // Register + online the real driver for the booking flows.
  const reg = await call("POST", "/drivers/register", driver.token, { name: "Test Driver", plate: "KEKE-TEST-001" });
  check("register whitelisted driver → 200", reg.status === 200 && reg.data?.vehicleType === "keke", reg);
  await online();

  console.log("\n── Booking variants: charter + priorityFee-ignored ──");
  const charter = await call("POST", "/rides", rider.token, { fromStop: "seet", toStop: "town", seats: 4, payMethod: "naira" });
  check("book seats=4 → charter, fare 60000, seatsTaken 4", charter.status === 200 && charter.data?.fare === 60000 && charter.data?.seatsTaken === 4 && charter.data?.pooled === false, charter);
  await call("POST", `/rides/${charter.data?.rideId}/cancel`, rider.token); // free the keke
  await online();
  const prio = await call("POST", "/rides", rider2.token, { fromStop: "seet", toStop: "town", seats: 1, priorityFee: 10000, payMethod: "naira" });
  check("book with priorityFee while surge OFF → fee ignored, fare 15000", prio.status === 200 && prio.data?.fare === 15000, prio);
  await call("POST", `/rides/${prio.data?.rideId}/cancel`, rider2.token);
  await online();

  console.log("\n── Ride lifecycle error edges (full paid flow) ──");
  const book = await call("POST", "/rides", rider.token, { fromStop: "seet", toStop: "town", seats: 1, payMethod: "naira" });
  const L = book.data?.rideId as string;
  check("book seet→town → matched", book.status === 200 && book.data?.stranded === false && book.data?.driverId === driver.uid, book);
  await markPaid(L);

  const statusNotYours = await call("POST", `/rides/${L}/status`, driver2.token, { status: "arriving" });
  check("status by non-driver → 403", statusNotYours.status === 403, statusNotYours);
  const status404 = await call("POST", `/rides/does-not-exist/status`, driver.token, { status: "arriving" });
  check("status on unknown ride → 404", status404.status === 404, status404);
  const statusIllegal = await call("POST", `/rides/${L}/status`, driver.token, { status: "started" });
  check("status assigned→started (skip arriving) → 409 illegal transition", statusIllegal.status === 409, statusIllegal);

  const arr = await call("POST", `/rides/${L}/status`, driver.token, { status: "arriving" });
  check("status arriving → 200", arr.status === 200, arr);
  const started = await call("POST", `/rides/${L}/status`, driver.token, { status: "started" });
  check("status started → 200", started.status === 200, started);

  const activeRides = await call("GET", "/drivers/me/rides", driver.token);
  check("GET /drivers/me/rides → includes the started ride", activeRides.status === 200 && activeRides.data?.rides?.some((r: Any) => r.rideId === L && r.status === "started"), activeRides);

  const qrNotYours = await call("GET", `/rides/${L}/qr`, rider.token);
  check("GET qr by rider (driver-only) → 403", qrNotYours.status === 403, qrNotYours);
  const qr404 = await call("GET", `/rides/does-not-exist/qr`, driver.token);
  check("GET qr unknown ride → 404", qr404.status === 404, qr404);
  const qr = await call("GET", `/rides/${L}/qr`, driver.token);
  const pin = qr.data?.pin as string;
  check("GET qr (driver) → qrToken + pin", qr.status === 200 && !!qr.data?.qrToken && /^\d{6}$/.test(pin ?? ""), qr);

  const compNotRider = await call("POST", `/rides/${L}/complete`, driver.token, { pin });
  check("complete by non-rider → 403", compNotRider.status === 403, compNotRider);
  const comp404 = await call("POST", `/rides/does-not-exist/complete`, rider.token, { pin });
  check("complete unknown ride → 404", comp404.status === 404, comp404);
  const compNeither = await call("POST", `/rides/${L}/complete`, rider.token, {});
  check("complete with neither qr nor pin → 400", compNeither.status === 400, compNeither);
  const compBoth = await call("POST", `/rides/${L}/complete`, rider.token, { qrToken: "x", pin: "123456" });
  check("complete with both qr AND pin → 400", compBoth.status === 400, compBoth);

  const comp = await call("POST", `/rides/${L}/complete`, rider.token, { pin });
  check("complete correct pin → 200", comp.status === 200, comp);
  const compAgain = await call("POST", `/rides/${L}/complete`, rider.token, { pin });
  check("complete already-completed → 409", compAgain.status === 409, compAgain);

  const rateNotRider = await call("POST", `/rides/${L}/rate`, driver.token, { stars: 5 });
  check("rate by non-rider → 403", rateNotRider.status === 403, rateNotRider);
  const rate404 = await call("POST", `/rides/does-not-exist/rate`, rider.token, { stars: 5 });
  check("rate unknown ride → 404", rate404.status === 404, rate404);
  const rate = await call("POST", `/rides/${L}/rate`, rider.token, { stars: 5 });
  check("rate completed ride → 200", rate.status === 200, rate);
  const rateAgain = await call("POST", `/rides/${L}/rate`, rider.token, { stars: 4 });
  check("rate again → 409 already rated", rateAgain.status === 409, rateAgain);

  const rating = await call("GET", `/drivers/${driver.uid}/rating`);
  check("GET /drivers/:id/rating → 200 average 5, count 1", rating.status === 200 && rating.data?.average === 5 && rating.data?.count === 1, rating);

  const cancelClosed = await call("POST", `/rides/${L}/cancel`, rider.token);
  check("cancel a completed ride → 409 already closed", cancelClosed.status === 409, cancelClosed);
  const cancel404 = await call("POST", `/rides/does-not-exist/cancel`, rider.token);
  check("cancel unknown ride → 404", cancel404.status === 404, cancel404);

  console.log("\n── rate-before-completed + cancel not-yours ──");
  await online();
  const nBook = await call("POST", "/rides", rider3.token, { fromStop: "seet", toStop: "town", seats: 1, payMethod: "naira" });
  const N = nBook.data?.rideId as string;
  const rateNotDone = await call("POST", `/rides/${N}/rate`, rider3.token, { stars: 5 });
  check("rate before completion → 409 not completed", rateNotDone.status === 409, rateNotDone);
  const cancelNotYours = await call("POST", `/rides/${N}/cancel`, rider.token);
  check("cancel someone else's ride → 403", cancelNotYours.status === 403, cancelNotYours);
  await call("POST", `/rides/${N}/cancel`, rider3.token); // clean up (→ cancelled/terminal)

  console.log("\n── Ride history: populated + pagination ──");
  // rider now has ≥1 terminal ride (L completed, charter cancelled). Add one more.
  await online();
  const pBook = await call("POST", "/rides", rider.token, { fromStop: "seet", toStop: "town", seats: 1, payMethod: "naira" });
  await call("POST", `/rides/${pBook.data?.rideId}/cancel`, rider.token);

  const riderHist = await call("GET", "/rides/history", rider.token);
  check("rider history → contains completed ride L with driverId",
    riderHist.status === 200 && riderHist.data?.rides?.some((r: Any) => r.rideId === L && r.status === "completed" && r.driverId === driver.uid), riderHist);
  const driverHist = await call("GET", "/drivers/me/rides/history", driver.token);
  check("driver history → contains completed ride L with riderId",
    driverHist.status === 200 && driverHist.data?.rides?.some((r: Any) => r.rideId === L && r.status === "completed" && r.riderId === rider.uid), driverHist);

  const page1 = await call("GET", "/rides/history?limit=1", rider.token);
  check("history limit=1 → 1 item + numeric nextCursor",
    page1.status === 200 && page1.data?.rides?.length === 1 && typeof page1.data?.nextCursor === "number", page1);
  const page2 = await call("GET", `/rides/history?limit=1&cursor=${page1.data?.nextCursor}`, rider.token);
  check("history page 2 (cursor) → different ride, newest-first order",
    page2.status === 200 && page2.data?.rides?.length === 1 && page2.data.rides[0].rideId !== page1.data.rides[0].rideId
      && page2.data.rides[0].createdAt <= page1.data.rides[0].createdAt, page2);

  console.log("\n── stranded ride → history driverId:null ──");
  // Take the driver offline so the next booking strands (no keke).
  await call("POST", "/drivers/online", driver.token, { online: false });
  const strand = await call("POST", "/rides", rider2.token, { fromStop: "seet", toStop: "gate", seats: 1, payMethod: "naira" });
  check("book with no online keke → stranded", strand.status === 200 && strand.data?.stranded === true && strand.data?.driverId === null, strand);
  await call("POST", `/rides/${strand.data?.rideId}/cancel`, rider2.token); // → cancelled/terminal
  const r2Hist = await call("GET", "/rides/history", rider2.token);
  check("stranded-then-cancelled ride shows driverId:null in history",
    r2Hist.status === 200 && r2Hist.data?.rides?.some((r: Any) => r.rideId === strand.data?.rideId && r.driverId === null), r2Hist);

  console.log("\n── Telegram webhook ──");
  if (WEBHOOK_SECRET) {
    const badSecret = await callRaw("POST", "/telegram/webhook", { "X-Telegram-Bot-Api-Secret-Token": "wrong-secret" }, { message: { chat: { id: 1 }, text: "/start x" } });
    check("webhook bad secret → 401", badSecret.status === 401, badSecret);
    const noop = await callRaw("POST", "/telegram/webhook", { "X-Telegram-Bot-Api-Secret-Token": WEBHOOK_SECRET }, {});
    check("webhook good secret, empty update → 200 no-op", noop.status === 200, noop);

    // Full handshake: mint a nonce via /me/telegram-link, resolve it through the webhook.
    const link = await call("POST", "/me/telegram-link", rider.token);
    const nonce = link.data?.nonce as string;
    const chatId = 987654321;
    const handshake = await callRaw("POST", "/telegram/webhook", { "X-Telegram-Bot-Api-Secret-Token": WEBHOOK_SECRET }, { message: { chat: { id: chatId }, text: `/start ${nonce}` } });
    const boundChat = (await db.collection("users").doc(rider.uid).get()).data()?.chatId;
    check("webhook valid nonce handshake → 200 + binds chatId", handshake.status === 200 && boundChat === chatId, { handshake: handshake.status, boundChat });
  } else {
    console.log("  ⏭️  telegram webhook skipped (no TELEGRAM_WEBHOOK_SECRET in env)");
  }

  console.log("\n── Cleanup ──");
  for (const uid of riderUids) {
    const snap = await db.collection("rides").where("riderId", "==", uid).get();
    await Promise.all(snap.docs.map((d) => d.ref.delete()));
    await db.collection("users").doc(uid).delete().catch(() => {});
    const subs = await db.collection("busProximitySubs").where("userId", "==", uid).get();
    await Promise.all(subs.docs.map((d) => d.ref.delete()));
  }
  await db.collection("ratings").doc(L).delete().catch(() => {});
  await db.collection("treasuryContributions").doc(L).delete().catch(() => {});
  for (const uid of [driver.uid, driver2.uid]) {
    await db.collection("drivers").doc(uid).delete().catch(() => {});
    await db.collection("users").doc(uid).delete().catch(() => {});
    const earns = await db.collection("earnings").where("driverId", "==", uid).get();
    await Promise.all(earns.docs.map((d) => d.ref.delete()));
  }
  console.log("  cleaned rides, ratings, treasury, drivers, users, subs, earnings");

  console.log(`\n${fail === 0 ? "🎉 ALL PASSED" : "⚠️  SOME FAILED"} — ${pass} passed, ${fail} failed\n`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((err) => { console.error("COVERAGE e2e crashed:", err); process.exit(1); });
