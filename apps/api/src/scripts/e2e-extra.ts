/**
 * Supplemental live test — covers the endpoints the main e2e-test.ts doesn't:
 * buses, SOS/incidents, withdraw, driver rating, telegram-link, and auth/validation
 * edge cases. Mints real Firebase tokens and drives a running backend, then cleans up.
 *
 * Usage (server must be running on E2E_BASE, with test-driver whitelisted):
 *   E2E_BASE=http://localhost:4021 DRIVER_WHITELIST=test-driver@futo-ride.test \
 *     npx tsx --env-file=../../.env.local src/scripts/e2e-extra.ts
 */

import { adminAuth, getAdminApp } from "../lib/firebase-admin.js";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const BASE = process.env.E2E_BASE ?? "http://localhost:4021";
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY!;
const db = getFirestore(getAdminApp());

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- test script
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
  console.log(`\n🧪 EXTRA E2E against ${BASE}\n`);

  const rider = await mint("test-rider@futo-ride.test", "Test Rider");
  const driver = await mint("test-driver@futo-ride.test", "Test Driver");
  const busUid = "test-bus-driver@futo-ride.test";
  const bus = await mint(busUid, "Test Bus Driver");
  await db.collection("drivers").doc(driver.uid).delete().catch(() => {});
  await db.collection("drivers").doc(bus.uid).delete().catch(() => {});

  console.log("── Auth / validation edges ──");
  const noAuth = await call("POST", "/drivers/online", undefined, { online: true });
  check("no token → 401", noAuth.status === 401, noAuth);
  const badToken = await call("GET", "/drivers/me/earnings", "not-a-real-token");
  check("bad token → 401", badToken.status === 401, badToken);
  const badBody = await call("POST", "/rides", rider.token, { fromStop: "seet", toStop: "seet" });
  check("from===to → 400 validation", badBody.status === 400, badBody);
  const unknownStop = await call("POST", "/rides", rider.token, { fromStop: "nope", toStop: "town" });
  check("unknown stop → 400", unknownStop.status === 400, unknownStop);

  console.log("\n── Driver rating (public) ──");
  const ratingMissing = await call("GET", "/drivers/does-not-exist/rating");
  check("rating unknown driver → 404", ratingMissing.status === 404, ratingMissing);

  console.log("\n── Withdraw edges ──");
  await call("POST", "/drivers/register", driver.token, { name: "Test Driver", plate: "KEKE-TEST-001" });
  const wBadFields = await call("POST", "/drivers/me/withdraw", driver.token, { amountKobo: 100, method: "bank" });
  check("withdraw bank w/o account fields → 400", wBadFields.status === 400, wBadFields);
  const wOver = await call("POST", "/drivers/me/withdraw", driver.token, { amountKobo: 999999999, method: "wallet", walletAddress: "SoLwallet111" });
  check("withdraw over balance → 409", wOver.status === 409, wOver);
  // Seed a balance and withdraw a valid slice.
  await db.collection("drivers").doc(driver.uid).set({ earningsKobo: 50000 }, { merge: true });
  const wOk = await call("POST", "/drivers/me/withdraw", driver.token, { amountKobo: 20000, method: "wallet", walletAddress: "SoLwallet111" });
  check("withdraw valid → 200 pending", wOk.status === 200 && wOk.data?.status === "pending" && wOk.data?.amountKobo === 20000, wOk);

  console.log("\n── SOS + incident report ──");
  const sos = await call("POST", "/sos", rider.token, { lat: 5.387, lng: 6.998, message: "test SOS" });
  check("SOS → 200 incidentId", sos.status === 200 && typeof sos.data?.incidentId === "string", sos);
  const rep = await call("POST", "/incidents/report", rider.token, { type: "off-route", message: "driver went off route", lat: 5.387, lng: 6.998 });
  check("incident report → 200 incidentId", rep.status === 200 && typeof rep.data?.incidentId === "string", rep);
  const repBad = await call("POST", "/incidents/report", rider.token, { type: "x", lat: 5.387, lng: 6.998 });
  check("incident report missing message → 400", repBad.status === 400, repBad);

  console.log("\n── Buses ──");
  const routes = await call("GET", "/buses/routes");
  const routeId = routes.data?.routes?.[0]?.id;
  check("GET /buses/routes → has town-a with stops", routes.status === 200 && routeId === "town-a" && Array.isArray(routes.data.routes[0].stops), routes);
  const eta = await call("GET", `/buses/routes/${routeId}/eta?lat=5.387&lng=6.998`);
  check("GET eta → stops w/ etaMin", eta.status === 200 && Array.isArray(eta.data?.stops) && typeof eta.data.stops[0]?.etaMin === "number", eta);
  const etaBad = await call("GET", `/buses/routes/nope/eta?lat=5.387&lng=6.998`);
  check("eta unknown route → 404", etaBad.status === 404, etaBad);
  const busReg = await call("POST", "/buses/register", bus.token, { name: "Bus Driver", plate: "BUS-1", routeId });
  check("bus register → 200 vehicleType bus", busReg.status === 200 && busReg.data?.vehicleType === "bus", busReg);
  const busRegKeke = await call("POST", "/buses/register", driver.token, { name: "Test Driver", plate: "KEKE-TEST-001", routeId });
  check("bus register on keke driver → 409", busRegKeke.status === 409, busRegKeke);
  const busLoc = await call("POST", "/buses/location", bus.token, { routeId, lat: 5.387, lng: 6.998 });
  check("bus location (registered) → 200", busLoc.status === 200, busLoc);
  const busLocKeke = await call("POST", "/buses/location", driver.token, { routeId, lat: 5.387, lng: 6.998 });
  check("bus location as keke driver → 403", busLocKeke.status === 403, busLocKeke);
  const prox = await call("POST", "/buses/proximity", rider.token, { routeId, stopId: "gate", enabled: true });
  check("proximity opt-in → 200 enabled", prox.status === 200 && prox.data?.enabled === true, prox);
  const proxBad = await call("POST", "/buses/proximity", rider.token, { routeId, stopId: "not-on-route", enabled: true });
  check("proximity bad stop → 400", proxBad.status === 400, proxBad);

  console.log("\n── Telegram link ──");
  if (process.env.TELEGRAM_BOT_TOKEN) {
    const tl = await call("POST", "/me/telegram-link", rider.token);
    check("telegram-link → 200 url+nonce", tl.status === 200 && typeof tl.data?.url === "string" && typeof tl.data?.nonce === "string", tl);
  } else {
    console.log("  ⏭️  telegram-link skipped (no TELEGRAM_BOT_TOKEN in env)");
  }

  console.log("\n── Payments (no Partna keys — expect graceful failures) ──");
  // Put the keke driver online so the booking MATCHES (payable), then init should
  // reach the Partna edge and fail on missing credentials with a 500 (config).
  await call("POST", "/drivers/online", driver.token, { online: true, lat: 5.387, lng: 6.998 });
  const book = await call("POST", "/rides", rider.token, { fromStop: "seet", toStop: "town", seats: 1, payMethod: "naira" });
  const rideId = book.data?.rideId;
  check("book (driver online) → matched, payable", book.status === 200 && book.data?.stranded === false, book);
  const initNoKeys = await call("POST", "/payments/init", rider.token, { rideId });
  check("payments/init w/o Partna keys → 500 (config)", initNoKeys.status === 500, initNoKeys);
  const verifyMissing = await call("POST", "/payments/verify", rider.token, { reference: "futoride-does-not-exist" });
  check("payments/verify unknown ref → 404", verifyMissing.status === 404, verifyMissing);

  console.log("\n── Cleanup ──");
  if (rideId) await db.collection("rides").doc(rideId).delete().catch(() => {});
  const rides = await db.collection("rides").where("riderId", "==", rider.uid).get();
  await Promise.all(rides.docs.map((d) => d.ref.delete()));
  await db.collection("drivers").doc(driver.uid).delete().catch(() => {});
  await db.collection("drivers").doc(bus.uid).delete().catch(() => {});
  for (const uid of [rider.uid, driver.uid, bus.uid]) await db.collection("users").doc(uid).delete().catch(() => {});
  const subs = await db.collection("busProximitySubs").where("userId", "==", rider.uid).get();
  await Promise.all(subs.docs.map((d) => d.ref.delete()));
  const w = await db.collection("withdrawals").where("driverId", "==", driver.uid).get();
  await Promise.all(w.docs.map((d) => d.ref.delete()));
  for (const uid of [rider.uid]) {
    const inc = await db.collection("incidents").where("riderId", "==", uid).get();
    await Promise.all(inc.docs.map((d) => d.ref.delete()));
  }
  void FieldValue; // (kept for parity with e2e helpers)
  console.log("  cleaned rides, drivers, users, subs, withdrawals, incidents");

  console.log(`\n${fail === 0 ? "🎉 ALL PASSED" : "⚠️  SOME FAILED"} — ${pass} passed, ${fail} failed\n`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((err) => { console.error("EXTRA e2e crashed:", err); process.exit(1); });
