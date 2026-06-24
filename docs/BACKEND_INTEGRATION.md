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

**Available now**
```
GET /health
Auth: none
200: { ok: true, data: { status: "ok" } }
```

**Planned (confirm in API.md before using)**
```
POST /rides              book a keke      → { rideId, driverId, etaMin, fare }
POST /rides/:id/cancel   cancel a ride    → { ok }
POST /rides/:id/complete confirm via QR   → { ok }
POST /sos                raise an incident→ { incidentId }
POST /drivers/online     driver go on/off → { online }
POST /payments/init      start a payment  → { reference, ... }
```

---

## 7. Request/response types

The backend's types live in `apps/api/src/types`. For the requests you send, here are the shapes you'll use (copy these into your app, or we can share them as a package later if you prefer):

```ts
type PayMethod = "naira" | "cngn";

type BookRideRequest = {
  fromStop: string;        // a campus stop id
  toStop: string;          // a campus stop id (≠ fromStop)
  payMethod: PayMethod;
  priorityFee?: number;    // only when surge is active
};

type BookRideResponse = {
  rideId: string;
  driverId: string;
  etaMin: number;
  fare: number;
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
