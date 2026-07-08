# API.md — Endpoint Registry

> The frontend's index of what the backend exposes (AGENTS.md §6–7). One entry per
> endpoint in `apps/api/src/routes`. Keep this and `apps/api/src/types` in sync —
> they are the frontend's contract. No Swagger; Zod schemas are the source of truth.

**Entry format:**

```
### POST /<resource>
Auth:  required (Firebase ID token) | none
Body:  { ... }
200:   { ok: true, data: { ... } }
4xx:   { ok: false, error: string }
Notes: validation rules, side effects, gotchas.
```

> **💰 Money:** every amount in this API is **integer kobo** (1 naira = 100 kobo).
> The frontend renders kobo→naira for display and sends kobo back. The backend
> converts to naira only internally when calling Monnify.

> **🛡️ Rate limits:** `POST /rides`, `POST /sos`, and `POST /incidents/report`
> are rate-limited (per-user). On breach they return **429 { ok:false, error }** —
> back off and retry, don't hammer.

> **This registry covers v6 hardening (PROJECT_PLAN §20).** Two deltas the frontend must note:
> **(1)** `POST /rides` with no available keke now returns **200 `{ stranded:true, rideId, driverId:null }`** (was `409`) so the rider can track/cancel the request.
> **(2)** `POST /rides/:id/complete` now requires the ride to be **`PAID` and `started`** (naira) — `402` if unpaid.

---

### GET /health
Auth:  none
200:   { ok: true, data: { status: "ok" } }

### GET /stops
Auth:  none
200:   { ok: true, data: { stops: [{ id, name, lat, lng }] } }
Notes: all campus stops (buildings + town) for the keke From/To pickers. Hardcoded in lib/campus-stops.ts.

---

### POST /drivers/register
Auth:  required (Firebase ID token) — must be on the SUG driver whitelist
Body:  { name: string, plate: string }
200:   { ok: true, data: { id, name, plate, vehicleType: "keke", capacity: 4 } }
4xx:   403 not an approved driver (not on whitelist)
Notes: (§20.6) onboards a KEKE driver — creates/updates the driver doc with vehicleType:"keke" and capacity:4 so the matcher can find them. Gated by the driver whitelist (DRIVER_WHITELIST env or an SUG-seeded allowedDrivers collection). Must be called once before going online. Bus drivers are still tagged automatically on first POST /buses/location.

### POST /drivers/online
Auth:  required (registered keke driver)
Body:  { online: boolean, lat?: number, lng?: number }
200:   { ok: true, data: { online: boolean } }
4xx:   403 not a registered keke driver (call POST /drivers/register first)
Notes: flips on/off duty + stores position; stamps lastSeenAt (heartbeat). Only ONLINE kekes seen within the last 2 min are matchable (§20.5).

### POST /drivers/location
Auth:  required (registered keke driver)
Body:  { lat: number, lng: number }
200:   { ok: true, data: { ok: true } }
Notes: backend-authoritative position used for matching; also refreshes lastSeenAt (heartbeat — call it every few sec while online, or the driver goes stale after 2 min and stops receiving pools). Live GPS broadcast is the app's own RTDB write.

### GET /drivers/me/rides
Auth:  required (the driver)
200:   { ok: true, data: { rides: [{ rideId, fromStop, toStop, status, seats, riderId, etaMin? }] } }
Notes: (§20.7) the ACTIVE rides (assigned | arriving | started) on the caller's keke — how the driver app opens the trip it was dispatched. The dispatch Telegram message also carries the rideId now.

### GET /drivers/me/earnings
Auth:  required (the driver)
200:   { ok: true, data: { totalKobo: number, recent: [{ rideId, amount, createdAt }] } }
Notes: (§20.2 payout ledger) running total + recent credits. A ride credits the driver (seat fare + their surge-bonus share) on completion. This is a ledger, not a live bank payout (deferred).

### GET /drivers/:id/rating
Auth:  none
200:   { ok: true, data: { average: number | null, count: number } }
4xx:   404 driver not found
Notes: average stars (1 dp) + number of ratings, maintained as a running aggregate on the driver doc. average is null until the first rating.

---

### POST /rides
Auth:  required (Firebase ID token, rider)
Body:  { fromStop: string, toStop: string, payMethod: "naira" | "cngn", seats?: 1..4 /*default 1*/, priorityFee?: number /*kobo, capped*/ }
200 (matched):  { ok: true, data: { rideId, driverId, etaMin, fare /*kobo*/, seats, seatsTaken, pooled /*bool*/, expiresAt /*epoch ms*/, stranded: false } }
200 (stranded): { ok: true, data: { rideId, driverId: null, fare, seats, pooled: false, stranded: true } }
4xx:   400 from===to or unknown stop · 409 "Keke just filled up, try again" (race) · 409 "You already have an active ride" · 429 rate-limited
Notes: SHARED-SEAT POOLING (§6a) + v6 hardening (§20).
  • ONE ACTIVE RIDE PER RIDER: a rider with a ride in requested/assigned/arriving/started gets 409 (§20.10).
  • MATCH: JOIN an existing pool on the SAME LANE — same `fromStop` AND same `toStop` — with free seats (nearest, and NOT already `started` — §20.10); else open a NEW pool on the nearest fully-free keke. Pooling on both stops keeps a keke one `from → to` trip (no zigzag pickup). Only kekes seen < 2 min ago are considered (heartbeat, §20.5). `pooled:true` = joined; `pooled:false` = fresh keke.
  • Seats claimed atomically (no overfill). Fare FLAT PER SEAT: fare = seats × SEAT_FARE_KOBO (+ priorityFee when honored). seats=4 charters the keke.
  • SURGE (§20 / §8): evaluated live per zone (= fromStop). priorityFee honored when surge is on OR was on within the last ~60s (grace window), and is capped; otherwise ignored (fee = 0).
  • TTL: a matched ride sets `expiresAt = now + 3 min`. If unpaid by then it's lazily swept to `expired`, seats freed, driver pinged (§20.1). A PAID ride never expires.
  • DISPATCH: a NEW pool pings the driver on Telegram (pickup→dropoff **+ rideId**, blind to bidding, + surge bonus when applicable); joins don't re-ping.
  • STRANDED (§20.10): no keke → returns **200 with `stranded:true` and the rideId** (was 409), records the ride `requested`, and raises a HIGH "stranded" incident (AI triage → Alerta → SUG Security, best-effort). The rider can track/cancel it; it is auto-considered when a keke frees up.
  • Mints a per-ride `qrToken` + `completionPin` (§20.3).

### POST /rides/:id/cancel
Auth:  required (rider or driver on the ride)
200:   { ok: true, data: { ok: true, rematched?: boolean, newDriverId?: string, refundPending?: boolean } }
4xx:   403 not your ride · 404 not found · 409 already closed
Notes: (§20.4) records `cancelledBy`. RIDER cancel → frees seats + pings the assigned driver (no ghost pickup). DRIVER cancel → frees the seat, then AUTO RE-MATCHES the rider to the next keke on the same lane (same fromStop + toStop) with same rideId + payment, fresh QR/PIN, new driver dispatched → `rematched:true, newDriverId`; if none free, ride goes `requested` (stranded incident) and, if already paid, `refundPending:true`. Cancelling AFTER `started` is allowed but raises an incident (§20.11).

### POST /rides/:id/status
Auth:  required (driver on the ride)
Body:  { status: "arriving" | "started" }
200:   { ok: true, data: { status: "arriving" | "started", affected: number } }
4xx:   402 rider hasn't paid · 403 not your ride · 404 not found · 409 already closed OR illegal transition
Notes: driver advances the trip; ordered only assigned→arriving→started (out-of-order → 409). (§20.2) The trip CANNOT advance until the ride is PAID → 402 otherwise (an unpaid booking can't tie up the driver; it just lapses on its expiry). (§20.11) FANS OUT to active pooled rides on the keke — one call advances every rider sharing the trip, but only PAID riders move (`affected` = how many advanced); unpaid peers stay `assigned` and expire. Completion is separate (per rider, QR/PIN).

### POST /rides/:id/complete
Auth:  required (rider on the ride)
Body:  { qrToken?: string, pin?: string }   // exactly one required
200:   { ok: true, data: { ok: true, fare /*kobo*/ } }
4xx:   400 invalid QR/PIN or neither supplied · 402 payment not confirmed · 403 not the rider · 404 not found · 409 already completed OR not started
Notes: (§20.3) rider proves presence by scanning the driver's QR **or** typing the PIN (constant-time compare). (§20.2) naira rides must be `PAID` first → else 402. (§20.11) ride must be `started` → else 409. On success: marks completed, frees the seat, credits the driver's earnings ledger.

### GET /rides/:id/qr
Auth:  required (driver on the ride)
200:   { ok: true, data: { qrToken: string, pin: string } }
4xx:   403 not your ride · 404 not found
Notes: (§20.3) the driver app renders `qrToken` as a QR AND shows `pin` as a short numeric fallback for riders whose camera can't scan.

### POST /rides/:id/rate
Auth:  required (rider on the ride)
Body:  { stars: 1..5, comment?: string }
200:   { ok: true, data: { ok: true } }
4xx:   403 not the rider · 404 not found

---

### POST /payments/init
Auth:  required (rider on the ride)
Body:  { rideId: string }
200:   { ok: true, data: { checkoutUrl: string, reference: string } }
4xx:   403 not your ride · 404 ride not found · 409 ride not payable (expired/cancelled/completed) · 500 payment not configured
Notes: starts a Monnify transaction for the ride fare (amount to Monnify in naira; you store kobo). (§20.2) IDEMPOTENT: if the ride already has an open (pending/paid) payment, its existing checkoutUrl/reference is returned instead of minting a new one — no double-charge on retries.

### POST /payments/verify
Auth:  required (Firebase ID token)
Body:  { reference: string }
200:   { ok: true, data: { status: string, amount /*kobo*/, paid: boolean } }
Notes: confirms a Monnify transaction, updates the stored Payment, and (§20.2) ONLY marks it PAID + stamps the ride `paymentStatus:"PAID"` (clearing its TTL) when Monnify status is PAID AND amountPaid == fare. A short/partial payment stays pending.

### POST /payments/webhook
Auth:  Monnify transaction signature (NOT a Firebase token) — Monnify is the caller
Body:  a Monnify transaction-completion event (sent by Monnify)
200:   { ok: true, data: { ok: true } }   (always 200 so Monnify doesn't retry a handled event)
401:   { ok: false, error: "Unauthorized" }   (bad/missing signature)
Notes: (§20.2) server-to-server reconciliation so a rider who closes the app mid-checkout is still marked paid. Verifies Monnify's signature (confirm exact header + hash algorithm against Monnify's live docs before trusting), then applies the same PAID + amount check as /verify. The mobile app never calls this.

---

### POST /me/telegram-link
Auth:  required (Firebase ID token)
200:   { ok: true, data: { url: string, nonce: string, expiresAt: number } }
Notes: (§20.9) mints a one-time, short-lived nonce and returns the bot deep link carrying it (`https://t.me/<bot>?start=<nonce>`). Replaces the old `?start=<uid>` link (uids leak, so a raw-uid link let anyone hijack a driver's dispatch channel). The app opens `url`; on Start, the webhook resolves nonce→uid and binds the chat id.

---

### POST /sos
Auth:  required (Firebase ID token, rider)
Body:  { rideId?: string, message?: string, lat: number, lng: number }
200:   { ok: true, data: { incidentId: string } }
Notes: event → AI triage (severity + summary + false-alarm flag) → Alerta → SUG Security Telegram. A flagged false alarm is still sent, tagged.

### POST /incidents/report
Auth:  required (Firebase ID token)
Body:  { rideId?: string, type: string, message: string, lat: number, lng: number }
200:   { ok: true, data: { incidentId: string } }
Notes: manual accident/off-route report; same triage→Alerta pipeline as /sos.

---

### POST /telegram/webhook
Auth:  X-Telegram-Bot-Api-Secret-Token header (NOT a Firebase token) — Telegram is the caller
Body:  a Telegram Update object (sent by Telegram)
200:   { ok: true, data: { ok: true } }   (always 200 so Telegram doesn't retry)
401:   { ok: false, error: "Unauthorized" }   (missing/wrong secret token)
Notes: the /start handshake. (§20.9) The app first calls POST /me/telegram-link to
       get a one-time NONCE, then deep-links to t.me/<bot>?start=<nonce>; on Start,
       Telegram calls this with "/start <nonce>" and the chat id. We resolve
       nonce→uid (short-lived, single-use) and store chatId on users/{uid} (and
       drivers/{uid} if it exists) so personal pings (bus proximity, driver
       dispatch) can deliver. A raw uid is NOT accepted (prevents hijacking a
       driver's channel). Server-to-server; the mobile app never calls it.

---

### GET /buses/routes
Auth:  none
200:   { ok: true, data: { routes: [{ id, name, stops: [{ id, name, lat, lng }] }] } }
Notes: all bus routes resolved to their ordered stops (campus → town).

### GET /buses/routes/:id/eta
Auth:  none
Query: lat: number, lng: number   (the bus's live position, read by the app from RTDB)
200:   { ok: true, data: { routeId, stops: [{ id, name, lat, lng, distKm, etaMin }] } }
4xx:   404 unknown route
Notes: ETA from the given bus position to each remaining stop ahead on the route (cumulative distance ÷ ~25 km/h). Stops already passed are omitted.

### POST /buses/location
Auth:  required (Firebase ID token, bus driver)
Body:  { routeId: string, lat: number, lng: number }
200:   { ok: true, data: { ok: true } }
4xx:   404 unknown route
Notes: bus driver posts its live position; updates the authoritative copy AND fires proximity pings to any rider whose subscribed stop the bus has just reached (de-duped per approach). Telegram delivery is best-effort.

### POST /buses/proximity
Auth:  required (Firebase ID token)
Body:  { routeId: string, stopId: string, enabled?: boolean }
200:   { ok: true, data: { enabled: boolean } }
4xx:   400 stop not on route · 404 unknown route
Notes: opt-in to "notify me when the [route] bus nears [stop]" (Telegram). Idempotent per (user, route, stop). Requires the Telegram handshake to actually deliver.

---

### GET /surge/:zone
Auth:  none
200:   { ok: true, data: { zone: string, surge: "on" | "off" } }
Notes: (§20 / §8) RE-EVALUATES surge live for a pickup stop (no longer just reads the last stored state — so it can't get stuck "on" all morning after a busy night). The rider app shows the priority-fee button only when "on". A fee opted into here is still honored by POST /rides for ~60s even if surge flips off in between (grace window).
