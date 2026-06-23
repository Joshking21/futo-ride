# FUTO Campus Keke & Bus App — Project Plan (v4 · consolidated)

> **Hackathon:** H4F 5.0
> **Primary target:** 🏆 Best Alerta Integration (₦150,000, Encrisoft) — *incident-comms.*
> **Stacked target:** 🤖 Best AI Project (₦150,000) — AI incident triage (same body of work as Alerta).
> **Light Solana touch (optional):** pay fare in cNGN on devnet — only to satisfy "how you use the chain" in the main-prize judging. **Escrow is cut.**
> **Architecture:** **Monorepo: Fastify backend (TypeScript) + Expo / React Native mobile + Firebase.**
> **Status:** Plan locked. Backend/data doc + coding next.

---

## 1. The Problem

FUTO's SUG just introduced campus **kekes (tricycles)** — live next semester — plus **buses that run to town**. Students can't see the nearest keke, can't track the town bus, have no easy digital payment, and have **no safety/incident layer** while moving around campus. We build all four, with **safety/incident communications as the headline**.

---

## 2. What Wins (strategy)

- **Alerta is an *incident-comms* tool** — win the track by treating it as such: SOS, off-route, stranded-student, accident, ops escalations, all routed to **SUG security on Telegram**. Arrival pings alone don't win it.
- **AI deepens Alerta, not a bolt-on** — an LLM classifies incident severity, summarises for security, and filters false alarms. Same work, second track (🤖). A generic chatbot is explicitly avoided ("substance over buzzwords").
- **Campus-internal scope is an advantage** — kekes run *building-to-building* on a small bounded campus; buses run *fixed routes*. Both shrink the geo problem to near-nothing (§7–8).
- **SUG partnership is the moat** — captive driver supply + student trust on day one.

---

## 3. Users / Roles

| Role | Who | What they do |
|---|---|---|
| **Rider** | FUTO student | Hail a keke (building→building), track the town bus, pay, scan-to-complete, SOS |
| **Driver** | Keke / bus operator | Go online, receive assignment (keke), broadcast position, show completion QR, get paid |
| **Admin / SUG Security** | Ops + safety team | Receive incident & ops alerts on **Telegram**, respond to SOS |

---

## 4. Tech Stack (locked)

| Layer | Choice | Notes |
|---|---|---|
| **Repo** | **Monorepo (`futo-ride`)** | `apps/mobile` (Expo app) + `apps/api` (Fastify backend). |
| **Mobile app** | **React Native (Expo) + NativeWind** | The frontend dev's app, own conventions. Talks to the backend over HTTP. |
| **Backend** | **Fastify (TypeScript), standalone** in `apps/api` | Secrets, token verify, logic, external calls, Admin-SDK writes. |
| **Auth** | **Firebase Auth** | Email/password + Google. Mobile talks to it directly via `@react-native-firebase/auth`. |
| **Realtime location** | **Firebase Realtime Database** | Live keke/bus GPS (mobile reads directly). |
| **App data** | **Firebase Firestore** | Rides, users, ratings, incidents, history. |
| **In-app push** | **FCM** | Native notifications via `@react-native-firebase/messaging`. |
| **Incident + social push** | **Alerta → Telegram** | SOS/incidents to SUG security; opt-in rider alerts. |
| **Naira payments** | **Monnify (Moniepoint)** | Primary. Sandbox to build (`MK_TEST_`, `sandbox.monnify.com`). |
| **Solana (optional)** | **cNGN direct transfer on devnet** + **Privy** wallet | Light touch only. No escrow. Cut freely. |
| **AI triage** | **LLM API** (eg Claude) | Severity + summary + false-alarm filtering (§11). |
| **Geo math** | **Turf.js** | Distance, nearest, geofence. Free, no infra. |
| **Maps** | **`react-native-maps`** | Mobile-side (frontend dev's domain). |
| **Scale later** | Redis GEO (Upstash) | `// TODO` — not needed at campus scale. |

---

## 5. Architecture (how it fits)

**Monorepo layout:**
```
futo-ride/
├── apps/
│   ├── mobile/          Expo + NativeWind app (frontend dev's domain)
│   └── api/             Fastify backend (ours)
│       └── src/
│           ├── server.ts
│           ├── lib/     http.ts · firebase-admin.ts · auth.ts (Layer 0) · monnify · alerta · ai-triage · geo · campus-stops
│           ├── types/   shared data models
│           └── routes/  Fastify route modules
├── docs/                PROJECT_PLAN · BACKEND_INTEGRATION · FRONTEND_SCREENS · UI_PROMPTS · API.md
├── AGENTS.md · CONVENTIONS.md · .env.example
```

**Division of labour:**
- **Mobile app (Expo)** — all UI; login via Firebase Auth (`@react-native-firebase/auth`); **realtime *reads*** (map, ride/bus status, notifications) straight from Firebase. Calls our backend over HTTP for actions.
- **Backend (Fastify)** — holds all secret keys; **verifies the Firebase ID token** (`verifyIdToken`); business logic (matching, fare, surge); external calls (Monnify, Alerta, LLM); authoritative writes via Admin SDK.
- **The contract between them:** `docs/BACKEND_INTEGRATION.md` + `docs/API.md`.

**Login flow:** mobile → Firebase Auth (gets ID token) → sends token to our Fastify API → backend verifies token → trusts request. *Firebase issues identity; our backend only verifies, never issues.*

**Safety of direct reads:** **Firebase Security Rules** restrict what each logged-in user can read/write (eg a rider reads only their own rides). Sensitive writes go through the backend Admin SDK.

---

## 6. Two Transport Modes

| | **Keke** | **Bus (to town)** |
|---|---|---|
| Movement | On-demand, **building → building** | **Fixed route**, set stops |
| Model | **Hail & dispatch** (FCFS + surge priority) | **Live transit tracker** (no dispatch) |
| Payment | Naira (or optional cNGN) | MVP: tracking only (flat fare on board / later) |
| Completion | QR scan at dropoff | n/a (rider just boards) |

This split keeps each mode simple and is itself a differentiator.

---

## 7. Geo Model

**Shared:** a fixed list of campus **buildings/stops** with hardcoded coordinates (copy each from Google Maps: right-click → click the `lat, lng`).

```ts
// lib/campusStops.ts — replace placeholders with real coords
export const CAMPUS_STOPS = [
  { id: "seet",    name: "SEET",         lat: 5.3870, lng: 6.9980 },
  { id: "library", name: "Main Library", lat: 5.3875, lng: 6.9972 },
  { id: "gate",    name: "Main Gate",    lat: 5.3858, lng: 6.9990 },
];
```

**Keke (hail):** rider picks **From → To** building. Nearest keke + ETA with Turf:
```ts
import * as turf from "@turf/turf";
// ⚠️ Turf uses [longitude, latitude] — NOT [lat, lng]. #1 bug source.
const km     = turf.distance(turf.point([stop.lng, stop.lat]),
                             turf.point([keke.lng, keke.lat]), { units: "kilometers" });
const etaMin = (km / 20) * 60;   // ~20 km/h keke speed
```

**Bus (track):** each route = an **ordered list of stops** ending in town. Buses broadcast GPS; show live position along the route; compute **ETA to each stop** (distance to next stop ÷ avg speed). Riders pick a route/stop and see "next bus ~X min." Opt-in: "notify me when the [Route] bus nears [stop]" → Telegram.

**Arrival trigger** (both modes) = a geofence: when ETA/distance drops below a threshold, fire the alert. Smooth GPS (moving average) so markers don't jump.

---

## 8. Dispatch & Pricing (keke only)

- **Default = FCFS.** Backend assigns; **driver never sees who bid** (kills gaming).
- **Surge-gated priority fee (optional):** the "priority" button is shown **only during surge**, hidden off-peak.

**Surge rule (locked):** evaluated per zone over a rolling **2-minute window**.
- **ON** when `pending_requests ≥ 3` **AND** `pending_requests > available_kekes × 1.5`.
- **OFF** when `pending_requests ≤ available_kekes × 1.2` (hysteresis stops it flapping on/off).

**Fee split (locked): split with the driver — default 50/50** (tunable). The driver's half is broadcast as a "surge bonus active — log on" signal via Telegram, which **pulls more kekes onto the road** exactly when supply is short, easing the surge instead of just taxing students. Driver's share = a real **tip**; platform's share = a **priority/service fee** (honest naming).

**Politics:** base FCFS always works, so non-payers are never stranded. Framing is always *"skip the queue,"* never *"pay or wait."*

---

## 9. Payments

**Completion proof = QR scan.** The **driver's phone shows a per-trip QR**; the **rider scans it at dropoff**. This proves both were present, marks the trip complete, and **triggers the driver payout**. (No escrow — payout is a backend action.)

- **Naira (Monnify) — primary.** Platform collects the fare; on QR-confirmed completion, it disburses to the driver.
- **cNGN (optional, devnet) — light Solana touch.** Rider may pay by sending cNGN on Solana devnet via their Privy wallet (a direct transfer, **no escrow program**). Purely a "we used the chain" showing; cut freely.

> Crypto is **not** legal tender in Nigeria → naira (Monnify) is always the primary path; cNGN is opt-in only.

---

## 10. Alerta Incident-Comms 🏆 (the winning layer)

**Base URL:** `https://api.alerta.encrisoft.com/v2`
**Auth headers:** `x-api-key`, `x-api-secret` (Configuration → API Credentials). *Ask Encrisoft for test token credits early.*
**Channel (locked): Telegram.** (`POST /v2/telegram/send`.)

> **Telegram handshake:** a bot can't message someone who hasn't started it. Opt-in = user taps "notify me" → deep-link to the bot → presses **Start** → we store their `chat_id`. Same for the SUG security group and driver dispatch.

### Incident catalogue → all route to the **SUG Security Telegram** group

| Event | Severity | Trigger |
|---|---|---|
| **SOS / panic button** | 🔴 CRITICAL | Rider taps SOS |
| **Accident reported mid-trip** | 🔴 CRITICAL | Rider/driver reports |
| **Driver off-route / trip stalled** | 🟠 HIGH | Route/ETA anomaly |
| **Stranded student (no keke after timeout, esp. night)** | 🟠 HIGH | No assignment in time |
| **Payment dispute / fraud signal** | 🟡 MEDIUM | Failed/duplicate pattern |
| **Surge active** | 🔵 INFO | Surge rule fires (§8) — driver broadcast |
| **Low driver supply / gateway error** | 🔵 INFO | Health check → admin |

### Example — SOS payload
```http
POST https://api.alerta.encrisoft.com/v2/telegram/send
x-api-key: <key>
x-api-secret: <secret>
```
```json
{
  "title": "🔴 SOS — student needs help",
  "severity": "critical",
  "message": "Chioma A. triggered SOS during ride KEKE-2381.",
  "meta": {
    "ride_id": "KEKE-2381",
    "driver": "plate ABC-123",
    "location": "https://maps.google.com/?q=5.3871,6.9978",
    "time": "20:14"
  }
}
```

> **Demo money-shot:** SOS → a real Telegram message landing in the security group, live on stage.

---

## 11. AI Incident Triage 🤖 (stacks on Alerta)

An **LLM sits between the event and Alerta** and makes the alert intelligent — same work, second track.

- **Severity classification** from full context (message + time of night + route deviation + location). *eg:* "driver took a wrong turn and won't answer" at 9pm escalates higher than at noon.
- **Summarisation** into one actionable line for the security group.
- **False-alarm filtering** — genuine SOS vs accidental tap, so security stays responsive.

**Flow:** `event → AI triage (severity + summary + action) → Alerta → Telegram`.

```json
{
  "title": "🔴 SOS — likely genuine (night, off-route)",
  "severity": "critical",
  "message": "AI: rider reports driver unresponsive + 400m off-route at 21:30. Recommend immediate dispatch to last location.",
  "meta": { "ai_confidence": 0.88, "ride_id": "KEKE-2381",
            "location": "https://maps.google.com/?q=5.3871,6.9978" }
}
```
> Feasible (one LLM call, no training), real substance, and it deepens the main target. **Alerta core first, AI second.**

---

## 12. Notification Layer (non-incident)

- **Ride lifecycle → rider** (FCM + optional Telegram): `requested → assigned (keke, plate, ETA) → arriving (~2 min) → arrived → started → completed → receipt`. *eg:* "🛺 Keke ABC-123 is ~2 min from Main Library."
- **Bus proximity → rider** (Telegram opt-in): "🚌 Town bus ~3 min from your stop."
- **Dispatch → driver** (Telegram): "📍 New pickup: SEET → Hostel C." Driver stays blind to bidding.

---

## 13. Core User Flows

**A. Rider onboarding** — open app → Firebase Auth (email/password or Google) → ready. *No crypto words shown.*

**B. Hail a keke** — pick **From: SEET → To: Library** → see nearest kekes + ETA → (if surge, optional priority) → pay (naira / optional cNGN) → matched → live-track → keke arrives → ride → **scan driver's QR** → rate driver.

**C. Track the town bus** — open Bus tab → pick route/stop → see live bus + ETA → optional "notify me when near my stop" → board.

**D. Safety (any time)** — tap **SOS** → confirm → AI triage → Alerta → SUG Security Telegram with live location.

**E. Driver** — login → **Go Online** → receive keke assignment (Telegram + app) → drive → at dropoff **show QR** → rider scans → **get paid**.

**F. SUG Security** — watch the Telegram group → respond to SOS/off-route/stranded → see ops alerts.

---

## 14. Data Model (Firestore — schemaless; types live in code)

> Firestore is **NoSQL/document**: no migrations, no JOINs. Define shape as **TypeScript types** and validate in the backend; denormalise instead of joining.

```ts
// /types
type User    = { id; name; email; role; chatId?; privyWallet? };
type Driver  = { id; name; plate; vehicleType: "keke"|"bus"; online;
                 currentLat; currentLng; routeId? };       // routeId for buses
type Stop    = { id; name; lat; lng };                      // hardcoded buildings
type Route   = { id; name; stopIds: string[] };             // bus: ordered stops → town
type Ride    = { id; riderId; driverId; fromStop; toStop; status;
                 fare; priorityFee; payMethod; qrToken; createdAt };
type Incident= { id; rideId?; type; severity; aiSeverity; aiSummary;
                 location; status; createdAt };
type Payment = { id; rideId; method; amount; status; ref };
type Rating  = { id; rideId; driverId; stars; comment? };
```
`Ride.status`: `requested | assigned | arriving | started | completed | cancelled`

---

## 15. Security Rules (sketch)

- A rider can read/write **only their own** `rides` and `payments`.
- Anyone authenticated can **read** live driver positions (the map), but only the **backend (Admin SDK)** writes them.
- `incidents` are **backend-write only**; security/admin read.
- Lock everything else to backend writes by default.

---

## 16. Build Phases (roadmap)

**Phase 1 — Core MVP (must-have)**
Firebase Auth · live keke map (RTDB + Turf + Google Maps) · hail building→building · FCFS assign · naira payment (Monnify sandbox) · QR completion · ride lifecycle via FCM.

**Phase 2 — Alerta + AI (🏆🤖 the prizes — priority)**
SOS → Telegram security routing · off-route + stranded detection · ops/surge alerts · Telegram handshake · **AI triage** (severity + summary + false-alarm filter).

**Phase 3 — Bus tracker**
Routes + live bus positions + ETA-to-stop + bus proximity opt-in.

**Phase 4 — Polish**
Surge-gated priority fee (50/50 split) · driver Telegram dispatch · ratings · demo rehearsal.

**Phase 5 — Light Solana (optional, cut-first)**
Privy wallet on payment screen + optional cNGN direct transfer on devnet. Leave a `// TODO` if time runs out.

> **Discipline:** Phases 1–2 are the whole game. Everything after is optional. Nothing eats Alerta time.

---

## 17. Decisions — Locked ✅

| Decision | Locked value |
|---|---|
| Repo / stack | Monorepo: Fastify backend + Expo/RN mobile + Firebase |
| Backend language | TypeScript (no Python/FastAPI) |
| Escrow | **Cut** (not even a stretch for now) |
| Priority fee | **Split with driver, 50/50** (tunable) |
| Surge trigger | `≥3 pending AND pending > kekes×1.5`; off at `≤ kekes×1.2`; 2-min window |
| Security channel | **Telegram** |
| Map SDK | **Google Maps** |
| Town buses | **Fixed routes** → transit-tracker model |
| Poof.new | **Not used** |

**Still to confirm:** real campus stop coordinates; final list of bus routes; whether rider & driver share one app or split into two.

---

## 18. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Drivers lack smartphones / won't adopt | SUG partnership; Telegram dispatch (low friction) |
| Alerta API token credits | Ask Encrisoft (sponsor) early |
| Google Maps billing setup | Attach billing account up front; free tier covers the hackathon |
| GPS jitter | Smoothing + assumed average speed |
| Scope creep | Phase discipline — Alerta + AI first |
| Crypto isn't legal tender (NG) | Naira (Monnify) always primary |

---

## 19. Next Steps

1. Confirm the §17 "still to confirm" items.
2. **Backend + data doc:** Fastify route modules per resource, Firestore collections as TS types, Security Rules, and the Alerta/Monnify/AI client modules.
3. Then scaffold the monorepo and build Phase 1.

*End of v4 — consolidated, all decisions locked.*