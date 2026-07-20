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
> converts to naira only internally at the Partna payment edge.

> **🛡️ Rate limits:** `POST /rides`, `POST /rides/:id/complete`, `POST /sos`, and
> `POST /incidents/report` are rate-limited (per-user). On breach they return
> **429 { ok:false, error }** — back off and retry, don't hammer.

> **This registry covers v6 hardening (PROJECT_PLAN §20).** Two deltas the frontend must note:
> **(1)** `POST /rides` with no available keke now returns **200 `{ stranded:true, rideId, driverId:null }`** (was `409`) so the rider can track/cancel the request.
> **(2)** `POST /rides/:id/complete` now requires the ride to be **`PAID` and `started`** — `402` if unpaid.

> **🔁 v7 payment migration (PROJECT_PLAN §21).** Payments moved from **Monnify + cNGN** to
> **Partna** (rider pays NGN → Partna settles USDC to the platform treasury). Frontend deltas:
> **(a)** `payMethod` is now **`"naira"` only** (cNGN removed); **(b)** `POST /payments/init`
> still returns `{ checkoutUrl, reference }` — `checkoutUrl` is a Partna hosted-onramp link;
> **(c)** new `POST /drivers/me/withdraw`, `POST /buses/register`, and staging-only
> `POST /payments/mock-deposit`; **(d)** `POST /rides/:id/rate` now needs a **completed** ride (409);
> **(e)** the pay-or-lose hold is now **10 min** (bank transfers are slower than cards).

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
200:   { ok: true, data: { rides: [{ rideId, fromStop, toStop, status, seats, riderId }] } }
Notes: (§20.7) the ACTIVE rides (assigned | arriving | started) on the caller's keke — how the driver app opens the trip it was dispatched. The dispatch Telegram message also carries the rideId now.

### GET /drivers/me/rides/history
Auth:  required (the driver)
Query: limit? (1..50, default 20) · cursor? (createdAt epoch ms of the last item on the previous page)
200:   { ok: true, data: { rides: [{ rideId, fromStop, toStop, status, seats, fare, riderId, createdAt }], nextCursor: number | null } }
Notes: the driver's PAST rides — terminal states only (completed | cancelled | expired), newest first. Cursor-paginated on createdAt: pass the previous page's `nextCursor` back as `cursor`; `nextCursor` is null when there are no more. Active rides are served by GET /drivers/me/rides. Needs composite index rides[driverId ASC, status ASC, createdAt DESC].

### GET /drivers/me/earnings
Auth:  required (the driver)
200:   { ok: true, data: { totalKobo: number, recent: [{ rideId, amount, createdAt }] } }
Notes: (§20.2 payout ledger) running total + recent credits. A ride credits the driver (**95%** seat share + their surge-bonus share) on completion (§21/P2). This is a ledger, not a live bank payout — withdraw via POST /drivers/me/withdraw.

### POST /drivers/me/withdraw
Auth:  required (the driver)
Body:  { amountKobo: number, method: "bank" | "wallet", accountNumber?, bankCode? /*bank*/, walletAddress? /*wallet*/ }
200:   { ok: true, data: { withdrawalId: string, status: "pending", amountKobo: number } }
4xx:   400 missing bank/wallet fields for the method · 404 driver not found · 409 insufficient balance
Notes: (§21/P3) batch withdrawal of ledger earnings. Debits `earningsKobo` transactionally (no overdraw, no double-spend) and records a `withdrawals` doc. The actual payout — Partna **offramp** (cryptoToFiat) to a bank, or on-chain **USDC** to a Privy wallet — is the documented deferred step; the record stays `pending` until then.

### GET /drivers/:id/rating
Auth:  none
200:   { ok: true, data: { average: number | null, count: number } }
4xx:   404 driver not found
Notes: average stars (1 dp) + number of ratings, maintained as a running aggregate on the driver doc. average is null until the first rating.

---

### GET /rides/history
Auth:  required (Firebase ID token, rider)
Query: limit? (1..50, default 20) · cursor? (createdAt epoch ms of the last item on the previous page)
200:   { ok: true, data: { rides: [{ rideId, fromStop, toStop, status, seats, fare, driverId, createdAt }], nextCursor: number | null } }
Notes: the rider's PAST rides — terminal states only (completed | cancelled | expired), newest first. Cursor-paginated on createdAt (pass the previous page's `nextCursor` back as `cursor`; null when done). `driverId` is null for a ride that never matched a keke (expired/cancelled while stranded). The rider's in-progress ride is NOT here — track it from the booking response. Needs composite index rides[riderId ASC, status ASC, createdAt DESC].

### POST /rides
Auth:  required (Firebase ID token, rider)
Body:  { fromStop: string, toStop: string, payMethod?: "naira" /*default "naira"; cNGN removed §21*/, seats?: 1..4 /*default 1*/, priorityFee?: number /*kobo, capped*/ }
200 (matched):  { ok: true, data: { rideId, driverId, etaMin, fare /*kobo*/, seats, seatsTaken, pooled /*bool*/, expiresAt /*epoch ms*/, stranded: false } }
200 (stranded): { ok: true, data: { rideId, driverId: null, fare, seats, pooled: false, stranded: true } }
4xx:   400 from===to or unknown stop · 409 "Keke just filled up, try again" (race) · 409 "You already have an active ride" · 429 rate-limited
Notes: SHARED-SEAT POOLING (§6a) + v6 hardening (§20).
  • ONE ACTIVE RIDE PER RIDER: a rider with a ride in requested/assigned/arriving/started gets 409 (§20.10).
  • MATCH: JOIN an existing pool on the SAME LANE — same `fromStop` AND same `toStop` — with free seats (nearest, and NOT already `started` — §20.10); else open a NEW pool on the nearest fully-free keke. Pooling on both stops keeps a keke one `from → to` trip (no zigzag pickup). Only kekes seen < 2 min ago are considered (heartbeat, §20.5). `pooled:true` = joined; `pooled:false` = fresh keke.
  • Seats claimed atomically (no overfill). Fare FLAT PER SEAT: fare = seats × SEAT_FARE_KOBO (+ priorityFee when honored). seats=4 charters the keke.
  • SURGE (§20 / §8): evaluated live per zone (= fromStop). priorityFee honored when surge is on OR was on within the last ~60s (grace window), and is capped; otherwise ignored (fee = 0).
  • TTL: a matched ride sets `expiresAt = now + 10 min` (§21 — bank transfers are slower than cards). If unpaid by then it's lazily swept to `expired`, seats freed, driver pinged (§20.1). A PAID ride never expires.
  • DISPATCH: a NEW pool pings the driver on Telegram — a **personal DM via our own bot** (native sendMessage, NOT Alerta): pickup→dropoff **+ rideId**, blind to bidding, + surge bonus when applicable; joins don't re-ping. Needs the driver to have connected Telegram (else skipped).
  • STRANDED (§20.10): no keke → returns **200 with `stranded:true` and the rideId** (was 409), records the ride `requested`, and raises a HIGH "stranded" incident (AI triage → Alerta → SUG Security, best-effort). The rider can track/cancel it; it is auto-considered when a keke frees up.
  • Mints a per-ride `qrToken` + `completionPin` (§20.3).

### POST /rides/:id/cancel
Auth:  required (rider or driver on the ride)
200:   { ok: true, data: { ok: true, rematched?: boolean, newDriverId?: string, refundPending?: boolean } }
4xx:   403 not your ride · 404 not found · 409 already closed
Notes: (§20.4 / §21 H4) records `cancelledBy` + frees the seat.
  • RIDER cancel → **tiered refund** (only a PAID ride refunds anything): `assigned` (driver not yet en route) → **full** refund (`refundPending:true`); `arriving` (driver en route) → a **cancellation fee** is credited to the driver, the rest refunded; after `started` → **no** refund, driver earns as if completed. Pings the assigned driver.
  • DRIVER cancel → AUTO RE-MATCHES the rider to the next keke on the same lane (same fromStop + toStop) with same rideId + payment, fresh QR/PIN, new driver dispatched → `rematched:true, newDriverId`; if none free, ride goes `requested` (stranded incident) and, if already paid, `refundPending:true`.
  • Cancelling AFTER `started` raises an incident (§20.11). Refunds are flagged (`refundPending`), settled via the deferred payout leg (§21).

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
Notes: (§20.3) rider proves presence by scanning the driver's QR **or** typing the PIN (constant-time compare). (§20.2) the ride must be `PAID` first → else 402. (§20.11) ride must be `started` → else 409. **Rate-limited** (429). On success (transactional, no double-credit — M7/§21): marks completed, frees the seat, credits the driver **95%** of the seat fare + surge-bonus share to the earnings ledger, and records the platform's **5%** cut (`treasuryContributions`, §21/P2).

### GET /rides/:id/qr
Auth:  required (driver on the ride)
200:   { ok: true, data: { qrToken: string, pin: string } }
4xx:   403 not your ride · 404 not found
Notes: (§20.3) the driver app renders `qrToken` as a QR AND shows `pin` as a short numeric fallback for riders whose camera can't scan.

### POST /rides/:id/rate
Auth:  required (rider on the ride)
Body:  { stars: 1..5, comment?: string }
200:   { ok: true, data: { ok: true } }
4xx:   403 not the rider · 404 not found · 409 ride not completed yet OR already rated (§21/N4)

---

### POST /payments/init
Auth:  required (rider on the ride)
Body:  { rideId: string }
200:   { ok: true, data: { checkoutUrl: string, reference: string } }
4xx:   403 not your ride · 404 ride not found · 409 ride not payable (expired/cancelled/completed) · 500 payment not configured (missing treasury/keys)
Notes: (§21) builds a **Partna hosted onramp** checkout for the ride fare — the rider pays NGN by bank transfer and Partna settles USDC into the platform treasury. `checkoutUrl` is the Partna pay link; open it in a WebView/browser. `reference` = `futoride-<rideId>`. (M10/§21) IDEMPOTENT: the payment doc is keyed by ride, so a retry returns the existing checkoutUrl/reference — no duplicate ramp.

### POST /payments/verify
Auth:  required (rider on the ride — ownership checked, §21/N3)
Body:  { reference: string }
200:   { ok: true, data: { status: string, amount /*kobo*/, paid: boolean } }
4xx:   403 not your payment · 404 payment not found
Notes: (§21) reads the authoritative Partna ramp status and reconciles the stored Payment. Marks it PAID + stamps the ride `paymentStatus:"PAID"` (clearing its TTL) as soon as the rider's naira is RECEIVED (the `Deposit`/`confirmed` fiat leg, amount ≥ fare) — so completion isn't blocked on the USDC conversion. Full USDC settlement (`completed`) is tracked separately for the treasury. (C3) if the money lands after the ride already expired/cancelled and was never paid, it flags the ride `refundPending` instead of reviving it.

### POST /payments/webhook
Auth:  Partna webhook signature (NOT a Firebase token) — Partna is the caller
Body:  a Partna webhook `{ event, data, signature }` (event e.g. "Onramp")
200:   { ok: true, data: { ok: true } }   (always 200 so Partna doesn't retry a handled event)
401:   { ok: false, error: "Unauthorized" }   (bad/missing signature)
Notes: (§21) server-to-server reconciliation so a rider who closes the app mid-checkout is still marked paid. Verifies Partna's **RSA-PSS/SHA-256 signature over the `data` field** (public key, `PARTNA_WEBHOOK_PUBLIC_KEY`) — confirm the exact signature byte-encoding against Partna's Node sample before trusting — then reconciles like /verify. The mobile app never calls this.

### POST /payments/mock-deposit   (staging/demo only)
Auth:  required (rider on the ride)
Body:  { rideId: string }
200:   { ok: true, data: { ok: true } }
4xx:   403 not your ride OR not a staging base URL · 404 ride not found
Notes: (§21) demo helper — calls Partna's staging `POST /mock/fiat-deposit` to simulate the rider's NGN bank transfer so the real onramp webhook fires without a human completing the hosted checkout. Refuses to run unless `PARTNA_BASE_URL` is a staging URL.

---

### POST /me/telegram-link
Auth:  required (Firebase ID token)
200:   { ok: true, data: { url: string, nonce: string, expiresAt: number } }
Notes: (§20.9) mints a one-time, short-lived nonce and returns the bot deep link carrying it (`https://t.me/<bot>?start=<nonce>`). Replaces the old `?start=<uid>` link (uids leak, so a raw-uid link let anyone hijack a driver's dispatch channel). The app opens `url`; on Start, the webhook resolves nonce→uid and binds the chat id.

### POST /me/fcm-token
Auth:  required (Firebase ID token)
Body:  { token: string }
200:   { ok: true, data: { registered: true } }
Notes: Registers an FCM device token for push notifications. Stores as an array (`fcmTokens`) to support multi-device. Automatically mirrored to the driver doc if the caller is a registered keke driver. Idempotent.

### DELETE /me/fcm-token
Auth:  required (Firebase ID token)
Body:  { token: string }
200:   { ok: true, data: { removed: true } }
Notes: Removes an FCM device token. Call this when the user logs out or if the token rotates on the client. Idempotent.

---

### POST /sos
Auth:  required (Firebase ID token, rider or driver)
Body:  { rideId?: string, message?: string, lat: number, lng: number }
200:   { ok: true, data: { incidentId: string } }
4xx:   403 rideId is not your ride · 404 rideId not found · 429 rate-limited
Notes: event → AI triage (severity + summary + false-alarm flag) → Alerta → SUG Security Telegram. A flagged false alarm is still sent, tagged. The persisted incident + the Telegram alert now carry the **reporter's identity** (`reporterUid`, name, role) and, when a ride is attached, the driver plate + route — so security knows WHO and WHICH ride (best-effort lookups that can never sink an SOS). `rideId` is optional (a location-only SOS is fine), but **if supplied it must be the caller's own ride** — a `rideId` is private (only the ride's rider/driver has it), so a foreign one is rejected (403), not accepted.

### POST /incidents/report
Auth:  required (Firebase ID token, rider or driver)
Body:  { rideId?: string, type: string, message: string, lat: number, lng: number }
200:   { ok: true, data: { incidentId: string } }
4xx:   403 rideId is not your ride · 404 rideId not found · 429 rate-limited
Notes: manual accident/off-route report; same triage→Alerta pipeline as /sos, and the same reporter-identity + rideId-ownership rules (foreign `rideId` → 403).

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

### POST /buses/register
Auth:  required (Firebase ID token, the bus driver)
Body:  { name: string, plate: string, routeId: string }
200:   { ok: true, data: { id, name, plate, vehicleType: "bus", routeId } }
4xx:   404 unknown route · 409 already registered as a keke driver
Notes: (§21/H6) explicit bus-driver onboarding — call ONCE before POST /buses/location. No whitelist (buses are lower-stakes than keke dispatch/money), but a real register step stops any authenticated student from corrupting the tracker, and refuses to convert an existing keke driver (which used to silently remove them from keke matching).

### POST /buses/location
Auth:  required (Firebase ID token, a REGISTERED bus driver)
Body:  { routeId: string, lat: number, lng: number }
200:   { ok: true, data: { ok: true } }
4xx:   403 not a registered bus driver (call POST /buses/register first) · 404 unknown route
Notes: bus driver posts its live position; updates the authoritative copy AND fires proximity pings to any rider whose subscribed stop the bus has just reached (de-duped per approach). Pings are **personal DMs via our own bot** (native sendMessage, NOT Alerta) — best-effort, and skipped for riders who haven't connected Telegram. (§21/H6) requires a registered bus driver — no longer auto-tags on first call.

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

---

### GET /treasury/balance
Auth:  none
200 (vault set):   { ok: true, data: { configured: true, balanceBaseUnits, totalIn, totalOut, maxPayout, usdcMint, authority, programId, vaultTokenAccount } }
200 (vault unset): { ok: true, data: { configured: false } }
Notes: (todo.md S2) live, on-chain read of the welfare-treasury **PDA vault** (Solana Anchor program in `apps/vault`, deployed to devnet). USDC amounts are **base units (6 dp)** — the only place the API speaks USDC instead of kobo. `balanceBaseUnits` = the vault's current USDC; `totalIn`/`totalOut` = lifetime contributed/paid-out. Public by design (transparency of the fund). When the backend has no vault env, returns `configured:false` and the naira/ledger flow runs unchanged. On ride completion the platform's 5% welfare cut is mirrored on-chain via the vault's `contribute` instruction (best-effort; `treasuryContributions` in Firestore stays the source of truth, and stores the on-chain `vaultSig` when it lands).
