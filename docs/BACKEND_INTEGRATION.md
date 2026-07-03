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

**Status codes:** `200` ok · `400` bad input · `401` missing/invalid token · `403` not allowed · `404` not found · `409` conflict · `500` server error.

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

POST /drivers/online         driver go on/off (+ position) → { online }
POST /drivers/location       driver position update        → { ok }
GET  /drivers/:id/rating     driver avg rating + count     → { average, count }

POST /rides                  book a keke (FCFS nearest)    → { rideId, driverId, etaMin, fare }
POST /rides/:id/cancel       cancel a ride                 → { ok }
POST /rides/:id/status       driver: arriving / started    → { status }
POST /rides/:id/complete     rider confirms via QR token   → { ok, fare }
GET  /rides/:id/qr           driver fetches the trip QR    → { qrToken }
POST /rides/:id/rate         rider rates the driver        → { ok }

POST /payments/init          start a Monnify payment       → { checkoutUrl, reference }
POST /payments/verify        confirm a payment             → { status, amount }

POST /sos                    raise an SOS (AI→Alerta)      → { incidentId }
POST /incidents/report       report accident/off-route     → { incidentId }

GET  /buses/routes           list routes + ordered stops   → { routes }
GET  /buses/routes/:id/eta   ETA to each stop from a pos   → { routeId, stops }
POST /buses/location         bus driver posts position     → { ok }
POST /buses/proximity        opt-in "notify near my stop"  → { enabled }

GET  /surge/:zone            surge state for a pickup stop → { zone, surge }
```

**Surge & the priority button (rider):** call `GET /surge/:zone` (zone = the pickup stop id) — if `surge: "on"`, show the optional priority-fee control on Ride Options; otherwise hide it. Send `priorityFee` (kobo) in `POST /rides` only when it's on; the backend ignores it off-surge. When set, half goes to the driver as a bonus and half is the platform service fee.

**Bus tracking:** subscribe to live bus positions from RTDB as usual. To show ETAs, pass the bus's current `lat`/`lng` to `GET /buses/routes/:id/eta` and you get cumulative ETA to each stop ahead. `GET /buses/routes` (no auth) gives you the route list + stops to populate pickers. `POST /buses/proximity` registers a Telegram proximity alert (needs the Telegram connect step first).

**Connecting Telegram (for personal pings):** your only job is a "Connect Telegram" button that deep-links the user to the bot with their uid:
```ts
import { Linking } from "react-native";
import auth from "@react-native-firebase/auth";
const uid = auth().currentUser!.uid;
Linking.openURL(`https://t.me/<YourBotUsername>?start=${uid}`);
```
The user presses Start in Telegram; the backend captures their chat id automatically (via its own `/telegram/webhook`, which you do NOT call). You can reflect "connected" by watching `users/{uid}.chatId` appear in your Firestore subscription. Until this is done, bus-proximity and dispatch pings are silently skipped.

**Ride lifecycle (driver-driven):** the driver advances the trip with `POST /rides/:id/status { status }` — `"arriving"` when en route to pickup, then `"started"` at pickup. Transitions are ordered (`assigned → arriving → started`); an out-of-order call returns `409`. Completion is separate (rider scans QR, below). The rider app doesn't call this — it just watches `rides/{id}.status` change via its Firestore subscription and updates the tracking UI.

**QR completion flow:** the driver app calls `GET /rides/:id/qr` and renders the `qrToken` as a QR code; the rider scans it and posts it to `POST /rides/:id/complete`. The backend verifies the token matches before completing — so a stranger with just the rideId can't close the trip.

---

## 7. Request/response types

The backend's types live in `apps/api/src/types`. For the requests you send, here are the shapes you'll use (copy these into your app, or we can share them as a package later if you prefer):

```ts
type PayMethod = "naira" | "cngn";

type BookRideRequest = {
  fromStop: string;        // a campus stop id
  toStop: string;          // a campus stop id (≠ fromStop)
  payMethod: PayMethod;
  priorityFee?: number;    // kobo — only when surge is active
};

type BookRideResponse = {
  rideId: string;
  driverId: string;
  etaMin: number;
  fare: number;            // kobo (divide by 100 to show naira)
};

type RideStatus =
  | "requested" | "assigned" | "arriving"
  | "started" | "completed" | "cancelled";
```

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
