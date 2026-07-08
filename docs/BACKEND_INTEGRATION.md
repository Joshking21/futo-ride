# BACKEND_INTEGRATION.md — How the Mobile App Uses the Backend

> **For the frontend dev.** This is the contract between the **Expo app** (`apps/mobile`) and our **Fastify backend** (`apps/api`). It does **not** tell you how to build your app — your tooling and conventions are your call. It only covers how to talk to the backend.
> Versions drift — if anything here disagrees with the live backend, the live backend (and `docs/API.md`) wins.

---

## 1. The split: backend vs. Firebase-direct

Two different sources of data — use the right one:

| You need… | Get it from | How |
|---|---|---|
| **Live keke/bus positions** | **Firebase Realtime DB** directly | subscribe with `@react-native-firebase/database` |
| **Ride/bus status updates** (assigned → arriving → arrived) | **Firestore** directly | subscribe with `@react-native-firebase/firestore` |
| **Notifications list, profile** | **Firestore** directly | subscribe / read |
| **Booking a ride, paying, SOS, going online** | **our backend** | HTTP call (this doc) |
| **Anything with logic, money, or secrets** | **our backend** | HTTP call |

**Rule of thumb:** *reading live data → Firebase directly. Doing something that changes state or touches money/logic → our backend.*

---

## 2. Base URL

The backend is a plain HTTP API. Put its URL in an Expo public env var:

```
EXPO_PUBLIC_API_URL=http://<dev-machine-ip>:<PORT>     # local dev
EXPO_PUBLIC_API_URL=https://api.futo-ride...           # deployed
```

> On a physical device, `localhost` won't reach your dev machine — use your machine's LAN IP (or a tunnel). Ask the backend dev for the current URL/port.

---

## 3. Auth — attach the Firebase ID token on every protected call

You already log users in with Firebase Auth. For any backend call, attach the user's **ID token** as a Bearer header. The backend verifies it and knows who's calling — you never send a userId yourself.

```ts
import auth from "@react-native-firebase/auth";

const token = await auth().currentUser?.getIdToken();
// header:  Authorization: Bearer <token>
```

The token auto-refreshes; just call `getIdToken()` right before each request. If there's no current user, the call is unauthenticated and the backend will reject protected routes with `401`.

---

## 4. The response envelope (every endpoint returns this)

```ts
// success
{ "ok": true,  "data": { ... } }
// failure
{ "ok": false, "error": "human-readable message" }
```

So you always check `ok` first:

```ts
const json = await res.json();
if (!json.ok) throw new Error(json.error);   // show json.error to the user
return json.data;                             // typed payload
```

**Status codes:** `200` ok · `400` bad input · `401` missing/invalid token · `402` payment required · `403` not allowed · `404` not found · `409` conflict · `429` rate-limited · `500` server error.

> **⚠️ v6 contract changes (PROJECT_PLAN §20) — read these two first:**
> 1. **Stranded is now `200`, not `409`.** `POST /rides` with no keke available returns `200 { stranded: true, rideId, driverId: null }` (so you can track/cancel the pending request). A real error is still an error; check `data.stranded`, not the status code, for "no keke".
> 2. **Completion needs payment + a started trip.** `POST /rides/:id/complete` returns `402` until the naira payment is confirmed `PAID`, and `409` unless the driver has marked the trip `started`. So: pay → wait for `started` → scan.
> Other additive changes: rides carry `expiresAt` (a 3-min pay-or-lose hold), the QR flow has a PIN fallback, the Telegram connect step now uses a one-time link, and drivers must `register` before going online. All detailed below.

### 💰 Money is always in **kobo**

Every money value the backend sends or accepts is an **integer in kobo** (1 naira = 100 kobo). So `fare`, `priorityFee`, `amount`, etc. are kobo.

- **Display:** divide by 100 to show naira → `₦${(fare / 100).toLocaleString()}`. e.g. `fare: 25000` → **₦250.00**.
- **Sending:** send kobo back (e.g. a `priorityFee` of ₦50 → `5000`).
- You never deal with naira on the wire — the backend converts to naira internally only when it talks to Monnify. Treat kobo as the single unit across the whole API.

---

## 5. A tiny client helper (adapt to your style)

You don't have to use this — but this is the whole pattern in one place:

```ts
import auth from "@react-native-firebase/auth";

const BASE = process.env.EXPO_PUBLIC_API_URL!;

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const token = await auth().currentUser?.getIdToken();
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error ?? "Request failed");
  return json.data as T;
}

// usage
// const ride = await apiPost("/rides", { fromStop, toStop, payMethod: "naira" });
```

---

## 6. Endpoints

> The **live, authoritative list is `docs/API.md`** (the backend dev keeps it current). Below is the shape to expect. Right now only the health check exists; the rest land as the backend is built — check `API.md` before wiring each.

**Live now** (full request/response detail in `docs/API.md`; money is kobo):
```
GET  /health                 health check                  → { status }
GET  /stops                  campus stops (keke pickers)   → { stops }

POST /me/telegram-link       mint one-time Telegram link   → { url, nonce, expiresAt }

POST /drivers/register       onboard a keke driver         → { id, name, plate, vehicleType, capacity }
POST /drivers/online         driver go on/off (+ position) → { online }
POST /drivers/location       driver position update        → { ok }
GET  /drivers/me/rides       driver's active assignments   → { rides }
GET  /drivers/me/earnings    driver earnings ledger        → { totalKobo, recent }
GET  /drivers/:id/rating     driver avg rating + count     → { average, count }

POST /rides                  book keke seat(s), pooled     → { rideId, driverId, etaMin, fare, seats, seatsTaken, pooled, expiresAt, stranded }
POST /rides/:id/cancel       cancel a ride                 → { ok, rematched?, newDriverId?, refundPending? }
POST /rides/:id/status       driver: arriving / started    → { status, affected }
POST /rides/:id/complete     rider confirms via QR OR PIN  → { ok, fare }
GET  /rides/:id/qr           driver fetches QR + PIN        → { qrToken, pin }
POST /rides/:id/rate         rider rates the driver        → { ok }

POST /payments/init          start a Monnify payment       → { checkoutUrl, reference }
POST /payments/verify        confirm a payment             → { status, amount, paid }
POST /payments/webhook       Monnify → backend (s2s)       → { ok }   (app never calls)

POST /sos                    raise an SOS (AI→Alerta)      → { incidentId }
POST /incidents/report       report accident/off-route     → { incidentId }

GET  /buses/routes           list routes + ordered stops   → { routes }
GET  /buses/routes/:id/eta   ETA to each stop from a pos   → { routeId, stops }
POST /buses/location         bus driver posts position     → { ok }
POST /buses/proximity        opt-in "notify near my stop"  → { enabled }

GET  /surge/:zone            live surge state for a zone   → { zone, surge }
```

**Surge & the priority button (rider):** call `GET /surge/:zone` (zone = the pickup stop id) — it now **re-evaluates surge live** — if `surge: "on"`, show the optional priority-fee control on Ride Options; otherwise hide it. Send `priorityFee` (kobo) in `POST /rides` when it's on; the backend honors it if surge is on **or was on within ~60s** (so a rider who opts in doesn't lose the fee if surge flips off as they tap Confirm), and ignores it otherwise. `priorityFee` is capped — an over-cap value is rejected (400). When honored, half goes to the driver as a bonus and half is the platform service fee.

**Bus tracking:** subscribe to live bus positions from RTDB as usual. To show ETAs, pass the bus's current `lat`/`lng` to `GET /buses/routes/:id/eta` and you get cumulative ETA to each stop ahead. `GET /buses/routes` (no auth) gives you the route list + stops to populate pickers. `POST /buses/proximity` registers a Telegram proximity alert (needs the Telegram connect step first).

**Connecting Telegram (for personal pings):** your "Connect Telegram" button now first asks the backend for a one-time link, then opens it (the old `?start=<uid>` link is gone — uids leak, so it let others hijack a driver's channel):
```ts
import { Linking } from "react-native";
const { url } = await apiPost("/me/telegram-link", {}); // POST, auth attached
Linking.openURL(url); // https://t.me/<Bot>?start=<one-time-nonce>
```
The user presses Start in Telegram; the backend resolves the nonce → their uid and captures their chat id automatically (via its own `/telegram/webhook`, which you do NOT call). Reflect "connected" by watching `users/{uid}.chatId` appear in your Firestore subscription. Until this is done, bus-proximity and dispatch pings are silently skipped. (The nonce is short-lived — mint a fresh one each time they tap Connect.)

**Shared-seat pooling (keke):** a keke has 4 seats and pools riders **on the same lane — same `fromStop` AND same `toStop`** (a "SEET → Town" keke; riders at a different pickup or destination get a different keke, so there's no zigzag pickup run). In `POST /rides`, send `seats` (1–4, default 1). The response's `pooled` tells you whether the rider joined an existing keke (`true`) or got a fresh one (`false`) — show "you're sharing this keke" vs "your keke is on the way". Fare is **flat per seat** (`seats × seat fare`), so 2 seats costs 2×. `seats: 4` = charter the whole keke. Each rider has their **own ride, own QR/PIN, own completion**. A rider may only have **one active ride at a time** (`409` otherwise). A pool **stops accepting new riders once its trip is `started`**. If no keke has room you get **`200 { stranded: true, rideId }`** (see the v6 note at the top) — not a 409. Seats free automatically on complete/cancel/expiry.

**The 3-minute pay-or-lose hold (`expiresAt`):** a matched ride comes back with `expiresAt` (epoch ms). The seat is held only until then — if the rider hasn't paid, the backend auto-releases it and the ride becomes `expired` (watch `rides/{id}.status`). So: after `POST /rides`, take the rider **straight to payment**; show a countdown to `expiresAt` if you like. A confirmed payment cancels the expiry.

**Ride lifecycle (driver-driven):** the driver advances the trip with `POST /rides/:id/status { status }` — `"arriving"` when en route to pickup, then `"started"` at pickup. Transitions are ordered (`assigned → arriving → started`); out-of-order returns `409`. **The driver can't advance an unpaid ride** — `402` until it's `PAID` (payment secures the seat before the driver commits). On a shared keke, one status call **advances every _paid_ pooled rider at once** (`affected` = how many); unpaid peers stay `assigned` and expire. The rider app doesn't call this — it watches `rides/{id}.status` via Firestore and updates the tracking UI.

**QR / PIN completion flow:** the driver app calls `GET /rides/:id/qr` → `{ qrToken, pin }`, renders `qrToken` as a QR **and** shows the short numeric `pin`. The rider scans the QR (or, if their camera won't focus, taps "enter PIN manually") and posts **either** to `POST /rides/:id/complete { qrToken }` **or** `{ pin }`. The backend verifies it matches before completing, so a stranger with just the rideId can't close the trip. Remember completion needs the ride **paid** (`402` otherwise) and **`started`** (`409` otherwise).

---

## 7. Request/response types

The backend's types live in `apps/api/src/types`. For the requests you send, here are the shapes you'll use (copy these into your app, or we can share them as a package later if you prefer):

```ts
type PayMethod = "naira" | "cngn";

type BookRideRequest = {
  fromStop: string;        // a campus stop id
  toStop: string;          // a campus stop id (≠ fromStop)
  payMethod: PayMethod;
  seats?: number;          // 1..4, default 1 — seats to book; 4 charters the keke
  priorityFee?: number;    // kobo, capped — only when surge is active (grace ~60s)
};

type BookRideResponse = {
  rideId: string;
  driverId: string | null; // null when stranded
  etaMin?: number;         // absent when stranded
  fare: number;            // kobo (divide by 100 to show naira) = seats × seat fare
  seats: number;           // seats booked on this shared keke
  seatsTaken?: number;     // seats now taken on the keke (incl. yours)
  pooled: boolean;         // true = joined an existing keke; false = fresh keke
  expiresAt?: number;      // epoch ms — pay before this or the seat is released
  stranded: boolean;       // true = no keke; the ride is "requested" — track/cancel it
};

type CompleteRideRequest =   // send exactly ONE of the two
  | { qrToken: string }
  | { pin: string };

type RideStatus =
  | "requested" | "assigned" | "arriving"
  | "started" | "completed" | "cancelled" | "expired";

// Driver app only:
type RegisterDriverRequest = { name: string; plate: string };
```

**Driver-app note (new):** a keke driver must call **`POST /drivers/register { name, plate }` once** (they must be SUG-whitelisted) before `POST /drivers/online` will work. To find the trip they were dispatched, call **`GET /drivers/me/rides`** (the Telegram dispatch also now contains the `rideId`). Earnings show via **`GET /drivers/me/earnings`**.

> When the backend adds or changes an endpoint, both `docs/API.md` and this file get updated — so this stays your single point of truth for the contract.

---

## 8. Errors — what to show the user

- On `!ok`, show `error` (it's already a clean, safe message — no stack traces).
- `401` → token missing/expired → send them back to login / re-auth.
- Network failure → your own "couldn't reach server, retry" UI.
- Never assume a call succeeded without checking `ok`.

---

## 9. What you do NOT call the backend for

Don't build backend endpoints into your flow for things you can read straight from Firebase — live positions, ride status, notifications. Subscribing to Firebase directly is faster and is the intended path. The backend is for **actions and logic**, not for relaying live reads.

---

*Questions about an endpoint that isn't in `docs/API.md` yet? Ask the backend dev — don't guess the shape.*
