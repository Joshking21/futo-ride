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
| **Payments** | **Partna V4** (onramp/offramp) | Rider pays **NGN** by bank transfer; Partna settles **USDC on Solana** into the platform treasury. Collect → ledger → batch withdraw (§21). Staging: `staging-api.getpartna.com`. **Replaces Monnify + cNGN.** |
| **Solana settlement** | **USDC on Solana** (via Partna) + **Privy** wallet (driver payout) | The chain layer is now real: treasury holds USDC, drivers can withdraw on-chain. No escrow program. cNGN is **dropped** (Partna doesn't support it). |
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
│           ├── lib/     http.ts · firebase-admin.ts · auth.ts (Layer 0) · partna · alerta · ai-triage · geo · campus-stops
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

### 6a. Keke seat pooling (shared rides) — v5 addition

Real campus kekes carry **up to 4 students sharing a destination**, not one private rider.
The keke model is therefore **shared-seat pooling**, decided as follows (locked):

- **Capacity:** every keke has **4 seats** (`capacity: 4`, `seatsTaken: 0..4`).
- **Pool by LANE (`fromStop` + `toStop`) — v6 correction:** riders are pooled onto the same
  keke **only when they share the same pickup AND the same destination** (e.g. everyone at
  SEET heading to Town). Destination-only pooling (the original v5 rule) was wrong: it would
  pool riders picked up at *different* buildings onto one keke, forcing an unrealistic zigzag
  pickup run. Keying on both stops makes a keke a single **`fromStop → toStop` trip** — it
  gathers at one stop and drives to one destination. Keeps the flat per-seat fare, one ETA,
  and one clean departure correct.
- **On-demand dispatch:** the **first** rider on a lane is assigned the nearest online keke
  with a free seat, opening a *pool* for that `fromStop → toStop` lane. Later riders on the
  **same lane** **join that same keke** (seat by seat) until it is full (4) or its trip
  **starts** (§20.10 — a rolling keke takes no new joins). When full/started, the keke is no
  longer offered; a new rider opens a fresh pool on the next available keke. No waiting
  timer — the keke is dispatched immediately on the first booking.
- **Flat per-seat fare:** each rider pays a **flat fare per seat** (`SEAT_FARE_KOBO`,
  distance-independent) — this is how campus kekes actually charge ("₦X to Town").
  `fare = seats × SEAT_FARE_KOBO`.
- **Charter (rare):** a rider may book **all 4 seats** (`seats: 4`) to take the whole keke —
  the "private ride" case — paying 4× the seat fare. No special path; just seats = 4.
- **Per-rider lifecycle:** the keke trip carries **multiple independent rides**. Each rider
  has **their own ride doc, their own QR, and their own completion** — the driver scans each
  rider out individually at their (shared) dropoff. A seat frees on each rider's
  complete/cancel; the keke is fully free when all its riders are done.
- **Surge:** unchanged in spirit — still evaluated per pickup zone; "available seats" (online
  kekes × free seats) replaces "available kekes" in the pending/available comparison.

> **Impact:** this changes keke **matching, fare, and the ride lifecycle** (all previously
> one-rider-per-keke). Bus, Alerta/AI/safety, payments-at-the-Monnify-edge, and the response
> envelope are unaffected. The API stays additive: `seats` is a new optional field on
> `POST /rides` (default 1); responses gain `seats` + `seatsTaken`.

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

**Live read + grace window (v6):** `GET /surge/:zone` now **re-evaluates surge live** (not just reads the last stored state), so it can't get stuck "on" all quiet morning after a busy night. Because surge can flip in the seconds between the rider reading it and booking, `POST /rides` **honors a submitted `priorityFee` if surge is on *or* was on within a short grace window (~60s)** — the rider is never charged a fee the driver doesn't get, and never silently loses a fee they opted into. `priorityFee` is capped (anti-abuse).

**Politics:** base FCFS always works, so non-payers are never stranded. Framing is always *"skip the queue,"* never *"pay or wait."*

---

## 9. Payments

**Completion proof = QR scan (or PIN fallback).** The **driver's phone shows a per-trip QR *and* a short numeric PIN**; the **rider scans the QR at dropoff** — or types the PIN if the camera fails (cracked screen, night glare, cheap Android). Either proves both were present, marks the trip complete, and **credits the driver's earnings ledger**. (No escrow.) See §20 for the PIN fallback and the ledger.

> **Payments are now Partna V4 (was Monnify + cNGN). Full architecture + endpoint detail in §21.** The lifecycle rules below (payment gates completion, ledger payout, TTL) are unchanged — only the *edge* (who collects the naira and where it settles) changed.

- **Payment gates completion.** A ride can only be completed **after** its payment is confirmed `PAID` — the backend links the Partna onramp to the ride and rejects completion until then (402). Closes the "ride free by skipping payment" hole.
- **Collect 100% → ledger → batch withdraw (the aggregator model).** The rider pays the **full fare in NGN**; Partna converts it to **USDC** and deposits it in the **platform treasury** (Solana). On completion the driver is credited **95%** (seat fare − 5% welfare cut) + their surge-bonus share into an `earnings` **ledger**; the 5% platform cut is recorded per ride (`treasuryContributions`). This dodges the **micro-transaction trap**: per-ride bank payouts (fees ₦10–25) would eat a ₦150 fare, so payout is **batched** — drivers withdraw at end of shift/week, not per ride.
- **Payout = an earnings ledger, not a live per-ride disbursement.** Drivers withdraw via `POST /drivers/me/withdraw` — **offramp** to a bank (Partna `cryptoToFiat`) or **on-chain USDC** to their Privy wallet. The ledger debit is built + transactional; the actual payout leg is the documented deferred step (like refunds).
- **Refunds = tiered rider-cancel policy (§21/H4).** Cancel while `assigned` → full refund; while `arriving` → cancellation fee to the driver, rest refunded; after `started` → no refund, driver earns as if completed. Refunds are flagged (`refundPending`), settled via the same deferred payout leg.

> Crypto is **not** legal tender in Nigeria → the rider always pays in **naira**; the USDC settlement is invisible to them (a treasury/liquidity implementation detail, exactly like Uber). Partna does **not** support cNGN, so cNGN is dropped and **USDC on Solana** is the settlement asset.

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
                 currentLat; currentLng; lastSeenAt?;        // heartbeat (§20)
                 capacity?; seatsTaken?; poolFromStop?; poolToStop?; poolStarted?;
                 ratingSum?; ratingCount?; earningsKobo?;    // ledger (§20)
                 routeId? };                                 // routeId for buses
type Stop    = { id; name; lat; lng };                      // hardcoded buildings
type Route   = { id; name; stopIds: string[] };             // bus: ordered stops → town
type Ride    = { id; riderId; driverId; fromStop; toStop; status;
                 fare; priorityFee; payMethod; qrToken; completionPin;
                 paymentStatus?; expiresAt?; cancelledBy?; cancelReason?;
                 seats; createdAt };
type Incident= { id; rideId?; type; severity; aiSeverity; aiSummary;
                 location; status; createdAt };
type Payment = { id; rideId; method; amount; status; ref };
type Rating  = { id; rideId; driverId; stars; comment? };
type Earning = { id; driverId; rideId; amount; createdAt };  // §20 payout ledger
type TelegramLink = { nonce; uid; expiresAt };               // §20 handshake token
```
`Ride.status`: `requested | assigned | arriving | started | completed | cancelled | expired`
(`expired` = the payment window lapsed before the rider paid — seats auto-freed, §20.)

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
| Payment provider | **Partna V4** (onramp collect NGN→USDC; offramp payout) — replaces Monnify + cNGN (§21) |
| Settlement asset | **USDC on Solana** (cNGN dropped — unsupported by Partna) |
| Platform fee | **5% welfare cut** of the seat fare (`PLATFORM_FEE_BPS`), driver keeps 95% (§21/P2) |
| Rider-cancel refund | **Tiered:** grace (full) / en-route (fee) / mid-trip (none) (§21/H4) |
| Payment window (TTL) | **10 min** `assigned` hold, then auto-`expired` (bank transfers are slower than cards) (§20/§21) |
| Driver heartbeat timeout | **2 min** silent → not matchable (§20) |
| Surge grace window | **60 s** after last "on" still honors a `priorityFee` (§20) |
| Completion fallback | **QR *or* numeric PIN** (§20) |
| Driver onboarding | **whitelist-gated `POST /drivers/register`** (§20) |
| Driver payout (MVP) | **earnings ledger** (real disbursement deferred) (§20) |
| Rate limiting | **on `/sos`, `/incidents/report`, `/rides`** (§20) |

**Still to confirm:** real campus stop coordinates; final list of bus routes; whether rider & driver share one app or split into two; the exact source of the driver whitelist (env list vs SUG-seeded Firestore collection).

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

---

## 20. Reliability & Lifecycle Hardening (v6) — flow-gap audit fixes

> A project-wide audit of the rider **and** driver flows surfaced link gaps where a
> ride, a seat, or a payment could get stuck, stolen, or skipped. These fixes close
> them. Everything below is **additive to the contract** except two intentional,
> flagged changes: the stranded case now returns **200 (with a rideId)** instead of
> 409, and completion now requires **payment + `started`**. The prize-winning
> Alerta/AI layer is untouched except to make it **more** robust (SOS never dies).

**20.1 Payment-abandonment TTL (the deadlock).**
A booked `assigned` ride carries `expiresAt = createdAt + 3 min`. If the rider never
pays within the window, the hold is **lazily swept**: the next booking or ride read
flags it `expired`, **frees the seat(s)**, and pings the driver that the pickup
dropped. No cron/infra — expiry is enforced on the read/booking paths. A `PAID` ride
never expires.

**20.2 Payment actually gates the ride.**
`/payments/verify` **and** a new Monnify **webhook** (`POST /payments/webhook`, verified
by Monnify signature — confirm the exact header/algorithm against Monnify's live docs)
link the payment back to the ride (`ride.paymentStatus`). Verify **checks the amount
paid == fare and status == PAID** before stamping it. `/payments/init` is **idempotent**
(reuses an open payment for the ride instead of minting duplicates → no double-charge).
`/rides/:id/complete` returns **402** until the ride is `PAID` (naira path). The
driver **also can't advance the trip** (`/rides/:id/status` → `arriving`/`started`)
until the ride is paid (**402**) — an unpaid booking can't tie up a driver; it just
lapses on its expiry. On a shared keke the status fan-out advances only the **paid**
riders; unpaid peers stay `assigned` and expire.

**20.3 QR PIN fallback (broken-camera trap).**
Alongside `qrToken`, each ride mints a short numeric **`completionPin`**. `GET
/rides/:id/qr` returns **both**; the rider app offers "enter PIN manually". `POST
/rides/:id/complete` accepts **`qrToken` OR `pin`** (constant-time compare, exactly one
required). A dead camera no longer strands a paid trip.

**20.4 Driver cancellation is no longer a black hole.**
`cancel` records **`cancelledBy`** (`rider | driver | system`). If the **driver**
cancels, the backend **auto re-matches** the rider to the next keke on the same
lane (same `fromStop` + `toStop`) — keeps the same rideId + payment, mints a fresh QR/PIN, dispatches the new
driver, rider's Firestore status flips back to `assigned`). If no keke is free, the
ride goes `requested` (stranded incident raised) and, **if already paid, a refund is
flagged** (`refundPending` — real Monnify refund is the same deferred disbursement
work as payout). If the **rider** cancels, the assigned **driver is pinged** so they
don't drive to a ghost pickup.

**20.5 Driver heartbeat (ghost keke).**
`/drivers/online` and `/drivers/location` stamp **`lastSeenAt`**. The matcher and the
surge seat-count **ignore any keke silent > 2 min** — a driver who force-closes the app
stops receiving pools even without calling `online:false`. Lazy, like the TTL.

**20.6 Driver identity & vetting (the silent blocker).**
*No backend path ever set `vehicleType:"keke"`*, so matching would have found **zero**
kekes. New **`POST /drivers/register { name, plate }`** creates the keke driver doc
(`vehicleType:"keke"`, `capacity:4`) and is **whitelist-gated** (SUG-approved drivers
only — `DRIVER_WHITELIST` env for the demo, or an SUG-seeded `allowedDrivers`
collection). `/drivers/online` now requires a registered keke driver (else 403) — a
random student can't self-appoint as a driver and receive dispatches.

**20.7 Driver can find their ride (the missing link).**
The Telegram dispatch had **no rideId**, and there was no way for a driver to list
their assignment — every driver action needs an id they never had. New **`GET
/drivers/me/rides`** (active rides on my keke) + the **rideId is now in the dispatch
message**. A matching Firestore rule lets a driver read rides where `driverId == uid`.

**20.8 SOS never dies (protect the prize).**
`raiseIncident` wraps AI triage in a fallback: if the LLM errors/times out, it uses a
safe default (`critical` for SOS) and **still persists + still alerts Telegram**. A
Gemini outage can no longer turn an SOS into a 500 with nobody notified.

**20.9 Telegram handshake can't be hijacked.**
uids leak (a rider sees a `driverId`), so the old `?start=<uid>` deep link let anyone
bind a driver's dispatch channel to their own chat. Replaced with a **one-time nonce**:
`POST /me/telegram-link` mints a short-lived token; the deep link carries the token; the
webhook resolves **token → uid** (never a raw uid).

**20.10 Booking abuse guards.**
One **active ride per rider** (no fleet-draining / no self-inflated surge). `priorityFee`
is **capped**. A pool is **closed to new joins once its trip is `started`** (no joining a
keke already driving away from your pickup). The **stranded case returns the rideId** (as
200 + `stranded:true`) so the rider can track/cancel it instead of getting an opaque 409.

**20.11 State-machine edges.**
`complete` is allowed **only from `started`** (driver must actually start the trip). A
status change **fans out to all active pooled riders** on the keke (one tap, not three).
Cancelling **after `started`** is allowed but **raises an incident** (mid-trip drop-off
is safety-relevant).

**20.12 Rate limiting.**
`@fastify/rate-limit` on `/sos`, `/incidents/report`, and `/rides` — a loop can't spam
the security group (or the LLM bill) or hammer the matcher.

**20.13 Bus staleness.**
Bus positions get **`lastSeenAt`**; proximity subscriptions **auto-disable** once
delivered / stale so a last-semester opt-in doesn't ping forever.

> **What did NOT change:** the response envelope, the money-is-kobo rule, the
> Alerta→Telegram incident pipeline shape, the bus ETA math, and the seat-pooling
> fare model. The frontend's two genuinely breaking deltas are **(a)** stranded is now
> `200 { stranded:true, rideId }` not `409`, and **(b)** completion needs payment +
> `started`. Both are called out in `BACKEND_INTEGRATION.md` and `FLOW_GUIDE.txt`.

---

## 21. Payment migration: Monnify + cNGN → Partna (v7)

> A full re-platform of payments plus a second flow-gap audit (see `docs/AUDIT_REPORT.md`
> for the finding-by-finding detail and verified Partna facts). **Monnify and cNGN are
> removed.** The rider still pays naira; the plumbing beneath is now Partna. Everything in
> §9/§20 (payment gates completion, ledger, TTL, QR) survives — only the edge changed.

**21.1 Why Partna (verified 2026-07-09 against docs.getpartna.com/v4).**
Partna connects NGN to stablecoins. Auth = `x-api-key` + `x-api-user` headers (no signing).
The core primitive is `POST /v4/ramp` — `fiatToCrypto` (onramp) / `cryptoToFiat` (offramp).
Two facts shape everything: **(a) cNGN is not a supported currency** (USDC/USDT/BTC/ETH are;
USDC-on-Solana is), so cNGN is dropped for **USDC on Solana**; **(b) there is no split field**
— 100% of an onramp lands at one address, so any 95/5 split is ours to do off-chain.

**21.2 Collection (onramp).** `POST /payments/init` builds a Partna **hosted onramp checkout**
(`<pay-host>/v4/pay/onramp?amount&from_currency=NGN&to_currency=USDC&to_network=solana&address=<treasury>&merchant&reference`)
and returns it as `checkoutUrl` (+ our `reference`). The rider pays NGN by bank transfer; Partna
converts and drops **USDC into the treasury**; a webhook (`pending→received→processing→completed`)
confirms it. `POST /payments/webhook` verifies Partna's **RSA-PSS/SHA-256 signature over the
`data` field** (public key, not an HMAC), then reconciles from the authoritative ramp status.
`POST /payments/verify` is the same reconcile as a fallback. **Demo:** staging + `POST
/payments/mock-deposit` fires the real webhook with no real naira.

**21.3 The ledger split (95/5).** On completion the driver is credited `seatFare × 95%` +
surge-bonus share; the platform's **5%** cut (`PLATFORM_FEE_BPS`) is recorded per ride in
`treasuryContributions`. Batching (below) is what makes 5% of a ₦150 fare viable — a per-ride
bank payout fee would exceed it.

**21.4 Payout (offramp / on-chain), batched.** `POST /drivers/me/withdraw` debits the earnings
ledger transactionally (no overdraw) and records a `withdrawals` doc. The real payout leg —
Partna `cryptoToFiat` to a bank, or an on-chain USDC transfer to a Privy wallet — is the
**documented deferred step** (same posture as §20.2's disbursement and §20.4's refunds).

**21.5 Second-audit code fixes folded in (detail in AUDIT_REPORT §3):**
- **C1** cNGN free-ride hole closed (`payMethod` collapsed to `naira`; payment gate is now
  method-agnostic).
- **C2** a paid/refund-pending stranded ride is never overwritten by a re-book (payment/refund
  trail preserved).
- **C3** a payment that lands **after** the ride expired/cancelled flags `refundPending` instead
  of reviving a dead ride.
- **H4** tiered rider-cancel refund policy (grace/en-route-fee/mid-trip).
- **H5** a paid rider whose driver goes stale is auto-rescued (re-match or strand+refund) on the
  next booking sweep — no longer stuck forever.
- **H6** bus drivers need an explicit `POST /buses/register`; `/buses/location` refuses
  non-registered callers and can't flip a keke driver to `bus`.
- **M7–M10 / N3–N4** transactional completion (no double-credit), rate-limited completion,
  Zod-validated LLM triage output, deterministic payment ids, `/payments/verify` ownership check,
  `/rate` requires a completed ride.

**21.6 Firestore hygiene.** The two in-memory-filter "index bypasses" are gone: `me/earnings`
and `sweepExpiredRides` now use indexed `orderBy`/range queries, with the composite indexes added
to `firestore.indexes.json` (`earnings[driverId,createdAt desc]`, `rides[status,expiresAt]`). The
remaining multi-field queries are equality/`in` and need no composite index.

**21.7 Honest-on-stage caveats (prod, not demo).** Partna limits **one pending ramp per account**
(concurrent riders need per-rider Partna accounts / KYC — the demo is serial); riders complete a
one-time **KYC** in production (staging uses test BVN/OTP); the ledger is naira-denominated while
the treasury holds USDC, so the platform carries **NGN/USDC FX** (usually favorable). The **Kamino**
idle-float yield play is a V2 pitch line, **not built**.

**21.8 What did NOT change:** the response envelope, kobo-internally rule, the Alerta→Telegram
incident pipeline, seat pooling, surge, bus tracking, and the QR/PIN completion proof.

---

*End of v4 — consolidated, all decisions locked. (v6 hardening in §20; v7 Partna migration in §21.)*