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

---

### GET /health
Auth:  none
200:   { ok: true, data: { status: "ok" } }

### GET /stops
Auth:  none
200:   { ok: true, data: { stops: [{ id, name, lat, lng }] } }
Notes: all campus stops (buildings + town) for the keke From/To pickers. Hardcoded in lib/campus-stops.ts.

---

### POST /drivers/online
Auth:  required (Firebase ID token)
Body:  { online: boolean, lat?: number, lng?: number }
200:   { ok: true, data: { online: boolean } }
Notes: upserts the driver doc (id = caller uid); sets online + position. lat/lng optional.

### POST /drivers/location
Auth:  required (Firebase ID token)
Body:  { lat: number, lng: number }
200:   { ok: true, data: { ok: true } }
Notes: backend-authoritative position used for matching. Live GPS broadcast is the app's own RTDB write.

### GET /drivers/:id/rating
Auth:  none
200:   { ok: true, data: { average: number | null, count: number } }
4xx:   404 driver not found
Notes: average stars (1 dp) + number of ratings, maintained as a running aggregate on the driver doc. average is null until the first rating.

---

### POST /rides
Auth:  required (Firebase ID token, rider)
Body:  { fromStop: string, toStop: string, payMethod: "naira" | "cngn", priorityFee?: number /*kobo*/ }
200:   { ok: true, data: { rideId, driverId, etaMin, fare /*kobo*/ } }
4xx:   400 from===to or unknown stop · 409 no keke available
Notes: assigns nearest ONLINE keke (FCFS). Surge is evaluated live per zone (= fromStop) over a 2-min window; priorityFee is only honored (added to fare) when surge is active. On assignment the driver gets a Telegram dispatch (pickup→dropoff, blind to bidding) including a surge bonus = 50% of the priority fee when one applies. Mints a per-trip qrToken. On the 409 no-keke path the request is still recorded (status "requested") and a HIGH "stranded" incident is raised (AI triage → Alerta → SUG Security), best-effort.

### POST /rides/:id/cancel
Auth:  required (rider or driver on the ride)
200:   { ok: true, data: { ok: true } }
4xx:   403 not your ride · 404 not found · 409 already closed

### POST /rides/:id/status
Auth:  required (driver on the ride)
Body:  { status: "arriving" | "started" }
200:   { ok: true, data: { status: "arriving" | "started" } }
4xx:   403 not your ride · 404 not found · 409 already closed OR illegal transition
Notes: driver advances the trip through the mid-ride states. Ordered only: assigned→arriving→started. Any out-of-order move (e.g. assigned→started, or re-setting the same state) returns 409. completion is a separate endpoint (rider scans QR).

### POST /rides/:id/complete
Auth:  required (rider on the ride)
Body:  { qrToken: string }
200:   { ok: true, data: { ok: true, fare /*kobo*/ } }
4xx:   400 invalid QR · 403 not the rider · 404 not found · 409 already completed
Notes: rider scans the driver's QR; backend verifies the token matches the stored one, then marks completed.

### GET /rides/:id/qr
Auth:  required (driver on the ride)
200:   { ok: true, data: { qrToken: string } }
4xx:   403 not your ride · 404 not found
Notes: the driver app renders this token as a QR for the rider to scan.

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
4xx:   403 not your ride · 404 ride not found · 500 payment not configured
Notes: starts a Monnify transaction for the ride fare. amount is sent to Monnify in naira; everything you see/store is kobo.

### POST /payments/verify
Auth:  required (Firebase ID token)
Body:  { reference: string }
200:   { ok: true, data: { status: string, amount /*kobo*/ } }
Notes: confirms a Monnify transaction and updates the stored Payment status.

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
Notes: the /start handshake. The app deep-links the user to the bot as
       t.me/<bot>?start=<uid>; on Start, Telegram calls this with "/start <uid>"
       and the chat id. We store chatId on users/{uid} (and drivers/{uid} if it
       exists) so personal pings (bus proximity, driver dispatch) can deliver.
       Only attaches to an EXISTING user doc. This is a server-to-server endpoint;
       the mobile app never calls it.

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
Notes: read-only current surge state for a pickup stop. The rider app shows the priority-fee button only when "on".
