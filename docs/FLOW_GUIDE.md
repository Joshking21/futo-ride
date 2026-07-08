# FUTO-RIDE — FULL FLOW & ENDPOINT GUIDE (for frontend + presentation)
 Read this top to bottom. It explains, in order:
   0. The big picture (who does what)
   1. Environment variables (backend) + what the frontend needs
   1b. WHAT CHANGED IN v6 (read this if you've integrated before)
   2. The two data sources: our backend (HTTP) vs Firebase (direct reads)
   3. Auth: signup, login, the token, every request
   4. The response envelope + money rule (KOBO)
   5. Stops & routes: what they are, how to "register" them
   6. KEKE vs BUS — the core difference, with code/QR flows
   7. EVERY endpoint, one by one: what it does, what to send, how, scenario
   8. Ratings: how the math works
   9. Surge & the priority fee: how it turns on/off and the 50/50 split
  10. Incidents / SOS / AI triage / Alerta → Telegram
  11. Telegram handshake (chatId) — what's needed for pings to work
  12. Full end-to-end scenarios (rider, driver, bus, SOS)
  13. What is NOT built yet (be honest in the demo)

 Everything here matches the live backend code as of this writing. If code and
 this file ever disagree, the code (and docs/API.md) wins.
===============================================================================


## 0. THE BIG PICTURE — who does what

There are 3 actors:
  • RIDER  — a FUTO student. Hails a keke, tracks the bus, pays, SOS.
  • DRIVER — a keke or bus operator. Goes online, gets assignments, shows QR.
  • SUG SECURITY — receives incident alerts on Telegram (not an app screen).

There are 2 "brains":
  • FIREBASE (Google) — issues identity (login), and stores live data the app
    reads DIRECTLY (live positions, ride status, notifications, profile).
  • OUR BACKEND (Fastify, the apps/api server) — does everything that involves
    LOGIC, MONEY, or SECRETS: booking, matching, fare, surge, payments, QR,
    SOS/AI, Telegram. The frontend calls it over HTTP.

Golden rule for the frontend:
  → Reading live data that changes on its own  = subscribe to Firebase directly.
  → Doing an action (book, pay, SOS, go online) = HTTP call to our backend.


## 1. ENVIRONMENT VARIABLES

BACKEND env (server-side only — these live in apps/api, NEVER in the app).
File: .env.example lists the names. Real values go in .env (never committed).

  # Firebase Admin (lets the backend verify tokens + write the database)
  FIREBASE_ADMIN_PROJECT_ID=        your Firebase project id
  FIREBASE_ADMIN_CLIENT_EMAIL=      service-account email
  FIREBASE_ADMIN_PRIVATE_KEY=       service-account private key (with \n escapes)

  # Monnify (naira payments)
  MONNIFY_API_KEY=                  from Monnify dashboard
  MONNIFY_SECRET_KEY=
  MONNIFY_CONTRACT_CODE=
  MONNIFY_BASE_URL=                 https://sandbox.monnify.com (test) or live
  MONNIFY_REDIRECT_URL=             where Monnify sends the user back after pay
  MONNIFY_WEBHOOK_SECRET=           verifies the Monnify -> backend webhook (§20.2)

  # Driver onboarding (whitelist gate — §20.6)
  DRIVER_WHITELIST=                 comma-separated approved driver emails (or use
                                    an SUG-seeded allowedDrivers Firestore collection)

  # Alerta (sends Telegram messages)
  ALERTA_API_KEY=
  ALERTA_API_SECRET=
  ALERTA_TELEGRAM_TARGET=           the SUG Security group chat target

  # AI triage (Google Gemini)
  LLM_API_KEY=                      Google GenAI API key
  LLM_MODEL=                        optional, defaults to gemini-3.5-flash

  # Server
  PORT=                             defaults to 3001 if unset

FRONTEND env (Expo public vars — safe to ship in the app):
  EXPO_PUBLIC_API_URL=http://<your-dev-machine-LAN-ip>:3001   (local dev)
  EXPO_PUBLIC_API_URL=https://api.futo-ride...                (deployed)

  IMPORTANT for testing on a real phone: "localhost" on the phone is the PHONE,
  not your laptop. Use your laptop's LAN IP (e.g. 192.168.x.x) or a tunnel.

The frontend ALSO needs the normal Firebase client config (apiKey, authDomain,
projectId, etc.) for @react-native-firebase — that's your standard Firebase
setup, unrelated to the backend secrets above.


## 1b. WHAT CHANGED IN v6 (flow-gap hardening — PROJECT_PLAN §20)
A project-wide audit closed gaps where a ride, seat, or payment could get stuck,
stolen, or skipped. Nearly all of it is additive; TWO changes touch how you code:

  1) NO-KEKE IS NOW A 200, NOT A 409.
     POST /rides with no keke available returns 200 { stranded:true, rideId,
     driverId:null }. Check data.stranded — don't treat "no keke" as an HTTP error
     anymore. You now get a rideId you can track/cancel.

  2) COMPLETION NEEDS PAYMENT + A STARTED TRIP.
     POST /rides/:id/complete returns 402 until the naira payment is PAID, and 409
     until the driver has marked the trip "started". Order: pay -> wait for
     "started" -> scan QR or type PIN.

  Everything else is additive and safe to adopt incrementally:
   • Each booked ride has expiresAt (a 3-min pay-or-lose seat hold). Pay promptly.
   • QR completion has a PIN fallback (GET /rides/:id/qr now returns { qrToken, pin };
     complete accepts { qrToken } OR { pin }).
   • "Connect Telegram" now calls POST /me/telegram-link first, then opens the
     returned url (the old ?start=<uid> link is retired).
   • A keke DRIVER must POST /drivers/register once before going online, and finds
     its trip via GET /drivers/me/rides (the dispatch message now carries rideId).
   • GET /surge/:zone re-evaluates live; a priority fee opted into is honored for
     ~60s even if surge flips off (grace window); priorityFee is capped.
   • One active ride per rider (409 if you already have one). A pool stops taking
     new riders once its trip is "started".
   • POST /rides, /sos, /incidents/report are rate-limited (429 on breach).
   • New status codes you'll see: 402 (payment required), 429 (rate-limited).


## 2. THE TWO DATA SOURCES (memorise this table)

  WHAT YOU NEED                         | GET IT FROM        | HOW
  --------------------------------------|--------------------|--------------------
  Live keke / bus positions (the map)   | Firebase RTDB      | subscribe directly
  Ride status (assigned→arriving→...)   | Firestore          | subscribe directly
  Notifications list, profile           | Firestore          | subscribe / read
  Booking, paying, SOS, going online    | OUR BACKEND        | HTTP (this guide)
  Anything with money / logic / secrets | OUR BACKEND        | HTTP

Libraries the frontend uses:
  • @react-native-firebase/auth      — login/signup, getIdToken()
  • @react-native-firebase/firestore — ride status, profile, notifications
  • @react-native-firebase/database  — live vehicle positions (RTDB)
  • fetch (built-in) or axios        — calling our backend
  • react-native-maps                — the map
  • a QR scanner (e.g. expo-camera / expo-barcode-scanner) — scan driver QR
  • a QR renderer (e.g. react-native-qrcode-svg) — driver shows the QR


## 3. AUTH — signup, login, and the token on every call

We do NOT have a /signup or /login endpoint. Identity is 100% Firebase.
Our backend only VERIFIES the token Firebase gives you; it never issues one.

SIGNUP (frontend, with @react-native-firebase/auth):
  1. User fills name/email/password (or taps Google).
  2. Create the Firebase user:
       await auth().createUserWithEmailAndPassword(email, password)
     (or the Google sign-in flow)
  3. THE APP then writes a user profile doc to Firestore:
       users/{uid} = { name, email, role: "rider" (or "driver"), createdAt }
     (the backend does not create this doc — the app does, because the app owns
      Firebase reads/writes for profile data.)
  4. User is now logged in; send them to Home.

LOGIN (frontend):
       await auth().signInWithEmailAndPassword(email, password)
  Then go to Home. Splash decides: if auth().currentUser exists → Home, else → Login.

THE TOKEN — attach it on EVERY protected backend call:
       const token = await auth().currentUser?.getIdToken();
       // header:  Authorization: Bearer <token>
  • Call getIdToken() right before each request — it auto-refreshes.
  • The backend reads the token, verifies it with Firebase Admin, and trusts the
    uid inside it. YOU NEVER SEND a userId in the body — the backend takes it
    from the token. (This is why "your own rides" works without you proving it.)
  • No token / bad token on a protected route → 401 { ok:false, error:"..." }.

Reusable client helper (adapt to your style):

    import auth from "@react-native-firebase/auth";
    const BASE = process.env.EXPO_PUBLIC_API_URL;

    async function api(path, method = "GET", body) {
      const token = await auth().currentUser?.getIdToken();
      const res = await fetch(BASE + path, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Request failed");
      return json.data;
    }


## 4. THE RESPONSE ENVELOPE + THE MONEY RULE

EVERY endpoint returns one of these two shapes:
    success:  { "ok": true,  "data": { ...payload... } }
    failure:  { "ok": false, "error": "human-readable message" }

So always check `ok` first; show `error` to the user on failure.

Status codes:
    200 ok · 400 bad input · 401 missing/invalid token · 402 payment required
    403 not allowed · 404 not found · 409 conflict (e.g. already completed)
    429 rate-limited (back off) · 500 server error

MONEY IS ALWAYS IN KOBO (integer). 1 naira = 100 kobo.
  • Every money field the backend sends/accepts is kobo: fare, priorityFee, amount.
  • TO DISPLAY: divide by 100 →  `₦${(fare/100).toLocaleString()}`
        e.g. fare: 25000  →  ₦250.00
  • TO SEND: send kobo →  a ₦50 priority fee = 5000
  • You NEVER deal in naira on the wire. The backend converts to naira only
    internally when it talks to Monnify. Treat kobo as the one unit everywhere.


## 5. STOPS & ROUTES — what they are and how to "register" them

STOPS (campus buildings + town) are HARDCODED in the backend, not a database.
File: apps/api/src/lib/campus-stops.ts
    export const CAMPUS_STOPS = [
      { id: "seet",    name: "SEET",          lat: 5.3870, lng: 6.9980 },
      { id: "library", name: "Main Library",  lat: 5.3875, lng: 6.9972 },
      { id: "gate",    name: "Main Gate",     lat: 5.3858, lng: 6.9990 },
      { id: "town",    name: "Town (Owerri)", lat: 5.4833, lng: 7.0333 }, // placeholder
    ];

  HOW TO REGISTER A NEW STOP (backend task, not an endpoint):
    1. On Google Maps, right-click the spot → click the "lat, lng" to copy it.
    2. Add a line to CAMPUS_STOPS with a unique kebab-case id, a display name,
       and the real lat/lng.
    3. Restart the backend. Done — it now appears anywhere stops are used.
  The "town" coords above are PLACEHOLDERS — replace with the real ones.

  The frontend gets the keke From/To stop list from GET /stops (single source of
  truth). Bus pickers get their stops from GET /buses/routes (each route already
  carries its ordered stops).

ROUTES (bus only) are also hardcoded.
File: apps/api/src/lib/routes.ts
    export const BUS_ROUTES = [
      { id: "town-a", name: "Campus → Town", stopIds: ["seet","library","gate","town"] },
    ];
  A route is just an ORDERED list of stop ids, ending in town. To add a route,
  add an object with a unique id, a name, and the ordered stopIds. The stop ids
  must exist in CAMPUS_STOPS.


## 6. KEKE vs BUS — THE CORE DIFFERENCE

These are two DIFFERENT models. Do not mix them.

  KEKE  = ON-DEMAND, SHARED SEATS (up to 4). Rider picks From → To (building to
          building) and how many SEATS (default 1). The backend pools riders on the
          SAME LANE — same PICKUP and same DESTINATION — onto one keke: it either
          JOINS the rider to an existing keke already on that fromStop→toStop lane
          (if it has room and hasn't started) or dispatches a fresh nearest ONLINE
          keke. Fare is FLAT PER SEAT. The rider pays, rides, and SCANS THE DRIVER'S
          QR (or types the PIN) at dropoff to complete their seat. Booking 4 seats =
          charter the whole keke (rare "private ride"). See 6a for the pooling rules.

  BUS   = FIXED ROUTE TRACKER. No assignment, no QR, no per-trip payment in MVP.
          Buses run a set route ending in town. The rider just watches the live
          bus move along the route and sees ETA-to-each-stop, and can opt in to
          "ping me on Telegram when the bus is near my stop." The rider boards.

  FEATURE                | KEKE                       | BUS
  -----------------------|----------------------------|---------------------------
  How it moves           | building → building        | fixed route → town
  Seats                  | SHARED, 4 seats, pooled    | n/a (just board)
  Matching/assignment    | YES (pool by destination)  | NO
  Fare in app            | YES, FLAT PER SEAT (Monnify)| NO (flat/on-board, later)
  QR completion          | YES (per rider, per seat)  | NO
  Live position source   | Firebase RTDB              | Firebase RTDB
  ETA                    | from booking response      | GET /buses/routes/:id/eta
  Telegram proximity     | (dispatch on new pool)     | opt-in ping to rider
  Driver posts location  | POST /drivers/location     | POST /buses/location

  In the data model both keke and bus drivers are "drivers" docs with a
  `vehicleType` of "keke" or "bus". A keke driver also has `capacity` (4) and
  `seatsTaken` (0..4); a bus driver has a `routeId`.

### 6a. KEKE SEAT POOLING — how sharing works (READ THIS for the booking UI)
  A keke seats 4. Riders SHARE a keke when they're on the SAME LANE — same PICKUP
  (fromStop) AND same DESTINATION (toStop). (v6 fix: destination-only pooling was
  wrong — it would put riders from different buildings on one keke and force a
  zigzag pickup. A keke is now one "fromStop → toStop" trip.)

  WHEN A RIDER BOOKS (POST /rides with fromStop, toStop, seats):
    • ONE ACTIVE RIDE PER RIDER: if you already have a ride in requested/assigned/
      arriving/started, you get 409 "You already have an active ride". Finish or
      cancel it first (§20.10).
    • The backend looks for a keke ALREADY on your lane (same fromStop AND toStop)
      with free seats AND not yet "started". If found → the rider JOINS it
      (pooled=true). (A pool that has already STARTED its trip no longer accepts
      joins — you won't be added to a keke driving away from your pickup, §20.10.)
    • Otherwise → the nearest fully-free keke, seen in the last 2 min (heartbeat),
      is dispatched as a NEW pool (pooled=false, driver gets the Telegram dispatch).
    • If nothing has room → NOT a 409 anymore: you get 200 { stranded:true, rideId }.
      The request is recorded, security is alerted, and you can track/cancel it (§20.10).
    • Seats are claimed atomically, so two riders can't overfill the same keke;
      if a keke fills up between your read and your booking you may get a 409
      "Keke just filled up, try again" — just retry (a new pool opens).
    • The matched ride carries expiresAt (now + 3 min). Pay before it or the seat is
      auto-released and the ride becomes "expired" (§20.1). A PAID ride never expires.

  FARE = FLAT PER SEAT: fare = seats × seat fare. Booking 2 seats costs 2×.
    Booking 4 seats = you've chartered the whole keke (the rare private ride).
    Distance does NOT change the pooled fare (that's how campus kekes charge).

  EACH SEAT = ITS OWN RIDE: every rider on a shared keke has their own rideId,
    own QR + PIN, and own completion. The driver scans each rider out individually
    at the shared dropoff. A seat frees the moment that rider completes or cancels.
    (The driver's "arriving"/"started" taps advance ALL pooled riders at once, but
    completion is still per-rider — each scans/enters their own code, §20.11.)

  FRONTEND UI HINTS:
    • Let the rider pick seats (1–4); show "you'll share this keke" when seats<4.
    • After booking, use `pooled`: true → "You're sharing a keke" ; false →
      "Your keke is on the way".
    • Show fare = seats × seat-fare so the number is obvious before they confirm.

THE QR / PIN / "CODE" FLOW (keke only) — how it actually works:
  1. When a keke is assigned (POST /rides), the backend MINTS a random secret
     `qrToken` AND a short numeric `completionPin`, stored on the ride. The rider
     never sees them; only the assigned driver can fetch them.
  2. The DRIVER app fetches both:  GET /rides/:id/qr  → { qrToken, pin }
     renders qrToken as a QR (react-native-qrcode-svg) AND shows the pin as text.
  3. At dropoff the RIDER scans the QR (getting the token string) — OR, if their
     camera won't focus (cracked screen, night glare), taps "Enter PIN manually"
     and types the pin the driver reads out. (§20.3 — no more broken-camera dead end.)
  4. The rider app sends EITHER:  POST /rides/:id/complete { qrToken }
                             or:  POST /rides/:id/complete { pin }
  5. The backend compares it to the stored value (constant-time). But first it
     checks the ride is PAID (else 402) and "started" (else 409). Match + paid +
     started → "completed", seat freed, driver's earnings ledger credited.
     No/!match → 400 "Invalid QR/PIN". This proves both people were present and
     stops anyone from completing a trip with just the rideId.


## 7. EVERY ENDPOINT — what / send / how / scenario
 Base URL = EXPO_PUBLIC_API_URL. "Auth: yes" means attach the Bearer token.
 All bodies are JSON. All responses are the { ok, data } envelope.

### GET /health
  Auth: no
  Send: nothing
  Returns: { status: "ok" }
  Use: a quick "is the backend up?" check. Scenario: app startup ping.

### GET /stops
  Auth: no
  Send: nothing
  Returns: { stops: [ { id, name, lat, lng } ] }
  What it does: returns every campus stop (buildings + town).
  Scenario: Book a Ride screen → populate the From and To building pickers from
    this list. Use the stop `id` (e.g. "seet") when calling POST /rides.

### POST /drivers/register                        (DRIVER) — call ONCE first
  Auth: yes (the driver) — MUST be on the SUG driver whitelist
  Send: { name: string, plate: string }
  Returns: { id, name, plate, vehicleType: "keke", capacity: 4 }
  Errors: 403 not an approved driver (not on the whitelist)
  What it does: (§20.6) onboards a KEKE driver — writes the driver doc with
    vehicleType:"keke" + capacity:4 so the matcher can actually find them. WITHOUT
    this, the backend has no keke to match and every rider booking would strand.
    Gated by the driver whitelist (DRIVER_WHITELIST env, or an SUG-seeded
    allowedDrivers collection) so a random student can't self-appoint as a driver.
  Scenario: Driver onboarding screen (one-time) → enter name + plate → register →
    then they can go online. Bus drivers don't use this (they're tagged "bus"
    automatically on their first POST /buses/location).

### POST /drivers/online                          (DRIVER)
  Auth: yes (a REGISTERED keke driver)
  Send: { online: boolean, lat?: number, lng?: number }
  Returns: { online: boolean }
  Errors: 403 not a registered keke driver (call POST /drivers/register first)
  What it does: flips the driver on/off duty, stores position, and stamps
    lastSeenAt (the heartbeat). Doc id = the driver's uid (from the token).
  Scenario: Driver Home screen, the big Online/Offline toggle. When the driver
    goes online, send { online:true, lat, lng }. Only ONLINE kekes SEEN IN THE LAST
    2 MINUTES are matchable (§20.5) — so keep the heartbeat fresh (see below).

### POST /drivers/location                        (DRIVER)
  Auth: yes (a registered keke driver)
  Send: { lat: number, lng: number }
  Returns: { ok: true }
  What it does: updates the backend's authoritative copy of the keke's position
    (used for matching) AND refreshes lastSeenAt (heartbeat). SEPARATE from the
    live GPS the driver app also writes to Firebase RTDB for the map.
  Scenario: keke driver app, EVERY FEW SECONDS while online, pushes its GPS here
    AND to RTDB. IMPORTANT (§20.5): if the backend hasn't heard from a driver in
    2 minutes it treats them as stale and stops sending pools (covers the "driver
    closed the app without going offline" ghost-keke case) — so this heartbeat
    isn't optional if you want to keep receiving assignments.

### GET /drivers/me/rides                          (DRIVER)
  Auth: yes (the driver)
  Send: nothing
  Returns: { rides: [ { rideId, fromStop, toStop, status, seats, riderId, etaMin? } ] }
  What it does: (§20.7) lists the ACTIVE rides (assigned | arriving | started) on
    the caller's keke. THIS IS HOW THE DRIVER APP OPENS THE TRIP IT WAS DISPATCHED —
    the dispatch used to give no rideId, so the driver had nothing to act on. (The
    Telegram dispatch message now also includes the rideId.)
  Scenario: Driver active-trip screen → on dispatch (or on foreground) call this →
    render the pickup(s); use each rideId for /status, /qr, /cancel.

### GET /drivers/me/earnings                       (DRIVER)
  Auth: yes (the driver)
  Send: nothing
  Returns: { totalKobo: number, recent: [ { rideId, amount, createdAt } ] }
  What it does: (§20.2 payout ledger) the driver's running earnings total + recent
    credits. On each completion the driver is credited (seat fare + their share of
    any surge bonus). This is a LEDGER, not a live bank payout — a real Monnify
    disbursement to the driver's account is a documented future step.
  Scenario: Driver "Earnings" screen → show today's total + a recent list.

### GET /drivers/:id/rating                       (anyone)
  Auth: no
  Send: nothing (id = the driver's uid in the URL)
  Returns: { average: number | null, count: number }
  What it does: returns the driver's average stars (1 decimal place) and how many
    ratings they have. average is null until the first rating exists.
  Scenario: Live Tracking driver card → show "⭐ 4.6 (23)". See section 8 for math.

### POST /rides                                   (RIDER) — the big one
  Auth: yes (the rider)
  Send: {
          fromStop: string,        // a stop id, e.g. "seet"
          toStop:   string,        // a stop id, must differ from fromStop
          payMethod: "naira" | "cngn",
          seats?:    number,       // 1..4, default 1 — seats to book; 4 = charter
          priorityFee?: number     // KOBO, capped, only if surge on (see section 9)
        }
  Returns (matched):  { rideId, driverId, etaMin, fare, seats, seatsTaken,
                        pooled, expiresAt, stranded:false }        // fare KOBO
  Returns (stranded): { rideId, driverId:null, fare, seats, pooled:false,
                        stranded:true }
  Errors: 400 from===to / unknown stop / priorityFee over cap ·
          409 "You already have an active ride" ·
          409 "Keke just filled up, try again" (a race filled the last seats) ·
          429 rate-limited (backoff)
  NOTE: "no keke available" is NO LONGER a 409 — it's a 200 with stranded:true
        (see step 6). Only the race and the one-active-ride cases are 409 now.
  What it does, step by step:
    1. Verifies you (rider) from the token.
    2. ONE ACTIVE RIDE GUARD (§20.10): if you already have a live ride, 409.
    3. Checks both stops exist and differ; reads seats (default 1).
    4. SEAT-AWARE MATCH (section 6a): tries to JOIN a keke already going to your
       toStop with free seats AND not yet "started" (nearest to pickup); else the
       nearest fully-free keke SEEN IN THE LAST 2 MIN (heartbeat) for a NEW pool.
    5. SURGE + FARE: evaluates surge live (against free SEATS). priorityFee is
       honored if surge is on OR was on within ~60s (grace, §20), and if within the
       cap; else it's dropped to 0. fare = seats × flat seat-fare + honored priorityFee.
    6. If a keke is found: atomically claims your seats, creates YOUR ride as
       "assigned" with YOUR own qrToken + completionPin, and sets expiresAt =
       now + 3 min (pay-or-lose hold, §20.1). NEW pool → dispatches the driver on
       Telegram (pickup→dropoff + rideId, blind to who paid); a JOIN doesn't re-ping.
       Returns …/pooled/expiresAt/stranded:false.
       (pooled=true → you joined an existing keke; pooled=false → fresh keke.)
    7. If NO keke has room (§20.10): records the request (status "requested") and
       returns 200 { stranded:true, rideId } — you get a rideId to track/cancel.
       Also raises a HIGH "stranded" incident (AI triage → Alerta → SUG Security)
       so security is aware — especially at night — best-effort (a triage/Alerta
       failure never blocks your booking response).
  Scenario: Ride Options → confirm From/To + pay method (+ priority if surge) →
    call this → if stranded, show "no keke right now, we've flagged it" and let
    them cancel/wait; else go STRAIGHT to Payment (the seat is only held to
    expiresAt) with the returned fare.
  AFTER this: subscribe to Firestore rides/{rideId} to watch status change
    (assigned → arriving → started → completed; or → expired/cancelled) — a
    Firebase read, not us.

### POST /rides/:id/cancel                        (RIDER or the assigned DRIVER)
  Auth: yes (must be the rider OR the driver on that ride)
  Send: nothing (id in URL)
  Returns: { ok: true, rematched?, newDriverId?, refundPending? }
  Errors: 403 not your ride · 404 not found · 409 already completed/cancelled
  What it does: (§20.4) records WHO cancelled (cancelledBy) and reacts:
    • RIDER cancels → frees the seat and PINGS the assigned driver on Telegram so
      they don't drive to a ghost pickup.
    • DRIVER cancels (e.g. keke broke down) → frees the seat, then AUTO RE-MATCHES
      the rider to the next keke on the same lane (same fromStop + toStop): same
      rideId, same payment, fresh QR/PIN, the new driver is dispatched, and
      rides/{id} flips back to "assigned" with the new driverId (returns
      rematched:true, newDriverId). If no keke is free, the ride goes "requested"
      (stranded incident) and, if already paid, refundPending:true (a real refund
      is the same deferred payout work).
    • Cancelling AFTER "started" is allowed but RAISES AN INCIDENT (§20.11) — a
      mid-trip drop-off is safety-relevant.
  Scenario: Live Tracking "Cancel ride" button. If the response says rematched,
    just keep watching rides/{id} — the driver card updates itself to the new keke.

### POST /rides/:id/status                        (the assigned DRIVER)
  Auth: yes (must be the driver on that ride)
  Send: { status: "arriving" | "started" }
  Returns: { status: "arriving" | "started", affected: number }
  Errors: 402 rider hasn't paid · 403 not your ride · 404 not found ·
          409 already closed OR illegal move
  What it does: the DRIVER drives the trip forward through its mid-ride states.
    The order is fixed:  assigned → arriving → started  → (then completed via QR/PIN).
      • "arriving" = driver is on the way to the pickup.
      • "started"  = rider is on board, trip underway.
    An out-of-order call (e.g. assigned → started, or repeating a state) → 409.
    (§20.2) THE DRIVER CANNOT ADVANCE AN UNPAID RIDE → 402 until it's PAID. So a
    rider who books but doesn't pay can't tie up the driver — the driver simply
    can't mark "arriving"/"started" for them, and the seat lapses on its 3-min
    expiry. (Pay first, THEN the driver moves the trip.)
    (§20.11) ON A SHARED KEKE this FANS OUT to the pooled rides at once — one
    "Start trip" tap advances every PAID rider sharing the keke (affected = how
    many advanced); any unpaid peer stays behind and expires. Completion is still
    per-rider (each scans/enters their own code below).
  Scenario: Driver active-trip screen → "I'm arriving" sends { status:"arriving" };
    "Start trip" sends { status:"started" }. The RIDER app does NOT call this — it
    watches rides/{id}.status change in Firestore and updates the tracking UI.

### GET /rides/:id/qr                             (the assigned DRIVER)
  Auth: yes (must be the driver on that ride)
  Send: nothing (id in URL)
  Returns: { qrToken: string, pin: string }
  What it does: (§20.3) gives the driver the secret token to render as a QR AND a
    short numeric PIN to read out if the rider's camera can't scan. Only the
    assigned driver can fetch them (403 otherwise).
  Scenario: Driver "Completion" screen → render qrToken with a QR library AND show
    the pin in large text → "rider scans the QR, or types this PIN".

### POST /rides/:id/complete                      (RIDER)
  Auth: yes (must be the rider on that ride)
  Send: { qrToken: string }  OR  { pin: string }   // exactly ONE — scanned or typed
  Returns: { ok: true, fare: number }   // fare in KOBO
  Errors: 400 invalid QR/PIN or neither sent · 402 payment not confirmed ·
          403 not the rider · 404 not found · 409 already completed OR not started
  What it does: (§20.2/§20.3/§20.11) checks the ride is PAID (naira; else 402) and
    "started" (else 409), then verifies the scanned token OR typed pin == stored
    (constant-time). On success → "completed", seat freed, driver earnings credited.
  Scenario: Scan-QR screen → camera reads the code → send { qrToken }. If the
    camera won't focus, "Enter PIN manually" → send { pin }. On success go to Trip
    Complete / Receipt. (If you get 402, the payment hasn't confirmed yet — verify
    it first; if 409 "not started", the driver hasn't tapped Start trip yet.)

### POST /rides/:id/rate                          (RIDER)
  Auth: yes (must be the rider on that ride)
  Send: { stars: 1..5 (integer), comment?: string }
  Returns: { ok: true }
  Errors: 403 not the rider · 404 not found · 409 already rated (one rating/ride)
  What it does: stores the rating (rating doc id = ride id, so you can't rate the
    same ride twice) and bumps the driver's running rating totals (see section 8).
  Scenario: Trip Complete screen → stars + optional comment → Done.

### POST /payments/init                           (RIDER)
  Auth: yes (rider on the ride)
  Send: { rideId: string }
  Returns: { checkoutUrl: string, reference: string }
  Errors: 403 not your ride · 404 ride not found · 409 ride not payable
          (expired/cancelled/completed) · 500 if payment not configured
  What it does: looks up the ride's fare (kobo), converts to naira internally,
    starts a Monnify transaction, stores a payment record, returns a checkoutUrl
    (card / bank transfer / virtual account) + a reference. (§20.2) IDEMPOTENT: if
    the ride already has an open payment, its existing checkoutUrl/reference is
    returned — so a double-tap or a retry does NOT create a second charge.
  Scenario: Payment screen (Naira) → call this → open checkoutUrl (in-app browser
    or WebView) → user pays → Monnify redirects to MONNIFY_REDIRECT_URL. Do this
    promptly — the seat is only held until the ride's expiresAt (3 min).

### POST /payments/verify                         (RIDER)
  Auth: yes
  Send: { reference: string }   // the reference from /payments/init
  Returns: { status: string, amount: number, paid: boolean }   // amount in KOBO
  What it does: asks Monnify the real status, updates the stored payment. (§20.2)
    It only marks the payment PAID and stamps the ride paymentStatus:"PAID"
    (clearing the ride's expiry) when Monnify says PAID AND the amount paid equals
    the fare — a short/partial payment stays pending. paid:true means the ride is
    now completable.
  Scenario: after the user returns from checkout, call this to confirm before
    unlocking completion. (A Monnify webhook also reconciles server-side, so even
    if the app dies here the payment still lands — but call verify for instant UX.)

### POST /payments/webhook            (MONNIFY → BACKEND, server-to-server)
  Auth: Monnify transaction signature (NOT a Firebase token). The app NEVER calls this.
  What it does: (§20.2) Monnify calls this when a transaction completes, so a rider
    who closes the app mid-checkout is still reconciled to PAID (same amount check
    as /verify). Listed here only so you know payments can confirm without /verify.

### GET /buses/routes                             (anyone)
  Auth: no
  Send: nothing
  Returns: { routes: [ { id, name, stops: [ {id,name,lat,lng} ] } ] }
  What it does: lists every bus route resolved to its ordered stops.
  Scenario: Bus tab → populate the route picker and the stop picker.

### GET /buses/routes/:id/eta?lat=..&lng=..       (anyone)
  Auth: no
  Send: query params lat & lng = the BUS's current position (which the app reads
    from Firebase RTDB and passes in)
  Returns: { routeId, stops: [ {id,name,lat,lng, distKm, etaMin} ] }
  What it does: from the bus's live position, computes cumulative distance and
    ETA (~25 km/h) to each stop AHEAD on the route. Passed stops are omitted.
  Scenario: Bus tracking screen → you already see the bus moving on the map
    (RTDB); to show "next bus ~X min to your stop", take the bus's lat/lng from
    RTDB and call this; render etaMin for the rider's chosen stop.
  Why pass lat/lng instead of the backend reading it? Live positions live in
    RTDB which the app already subscribes to — passing them keeps this stateless
    and instant. (You read once, hand it to us, we do the geo math.)

### POST /buses/location                          (BUS DRIVER)
  Auth: yes (the bus driver)
  Send: { routeId: string, lat: number, lng: number }
  Returns: { ok: true }
  Errors: 404 unknown route
  What it does: stores the bus's authoritative position (and tags the driver as
    vehicleType "bus" on that routeId) AND fires Telegram pings to any rider whose
    subscribed stop the bus has just reached (de-duped so each approach pings once).
  Scenario: bus driver app, periodically while driving the route, posts position
    here (and to RTDB for the live map). This is what powers proximity pings.

### POST /buses/proximity                         (RIDER)
  Auth: yes (the rider)
  Send: { routeId: string, stopId: string, enabled?: boolean (default true) }
  Returns: { enabled: boolean }
  Errors: 400 stop not on that route · 404 unknown route
  What it does: registers (or toggles) "notify me when the [route] bus nears
    [stop]". Idempotent per (user, route, stop). For the ping to actually arrive,
    the rider must have connected Telegram (chatId on their user doc) — section 11.
  Scenario: Notifications screen → "notify me when a bus is near [building]" →
    pick route + stop → toggle on → call this. (Also show the Connect Telegram step.)

### GET /surge/:zone                              (anyone)
  Auth: no
  Send: nothing (zone = a pickup stop id, e.g. "seet")
  Returns: { zone, surge: "on" | "off" }
  What it does: (§20 / §8) RE-EVALUATES surge live for that pickup zone (it no
    longer just reads the last stored flag, so it can't stay stuck "on" all quiet
    morning after a busy night).
  Scenario: Ride Options screen → call GET /surge/<fromStop>; if "on", SHOW the
    optional priority-fee control with a "skip the queue" note; if "off", HIDE it.
    A fee the rider opts into is still honored by POST /rides for ~60s even if
    surge flips off as they tap Confirm (grace window) — so they never lose it.

### POST /sos                                     (RIDER) — the prize feature
  Auth: yes (the rider)
  Send: { rideId?: string, message?: string, lat: number, lng: number }
  Returns: { incidentId: string }
  What it does: builds context (type, time of day, location link, ride) → calls
    the AI to classify severity + summarise + flag false alarms → saves the
    incident → sends a Telegram alert to the SUG Security group. A likely false
    alarm is STILL sent (tagged), so security stays the judge.
  Scenario: SOS overlay → "Send SOS" → send current lat/lng (+ rideId if mid-trip)
    → show "help has been alerted". THE DEMO MONEY-SHOT: a real Telegram message
    landing in the security group live on stage.

### POST /incidents/report                        (RIDER or DRIVER)
  Auth: yes
  Send: { rideId?: string, type: string, message: string, lat: number, lng: number }
        e.g. type "accident" or "off-route"
  Returns: { incidentId: string }
  What it does: same AI-triage → Alerta → Telegram pipeline as SOS, but for a
    manual report (accident, driver off-route, etc.). Rate-limited like /sos.
  Scenario: a "Report a problem" action mid-trip.

### POST /me/telegram-link                         (RIDER or DRIVER)
  Auth: yes (any logged-in user)
  Send: nothing
  Returns: { url: string, nonce: string, expiresAt: number }
  What it does: (§20.9) mints a ONE-TIME, short-lived nonce and returns the bot
    deep link carrying it (https://t.me/<bot>?start=<nonce>). This REPLACES the old
    ?start=<uid> link — uids leak (a rider sees a driverId in the ride response), so
    a raw-uid link let anyone bind a driver's dispatch channel to their own chat.
  Scenario: "Connect Telegram" button → call this → Linking.openURL(url). See
    section 11 for the full handshake.


## 8. RATINGS — how the math works

When a rider rates a ride (POST /rides/:id/rate { stars }):
  • A rating doc is written with id = the ride id. Because the id is the ride id,
    a second attempt to rate the same ride returns 409 — exactly one rating per ride.
  • The driver's doc gets two running counters bumped atomically:
        ratingSum   += stars     (e.g. +4)
        ratingCount += 1
  • We do NOT re-scan all ratings each time — we keep the running totals. This is
    fast and cheap (O(1) per rating, O(1) to read).

When someone reads GET /drivers/:id/rating:
        average = round( ratingSum / ratingCount , 1 decimal )   // null if count 0
        count   = ratingCount
  Example: a driver with ratingSum 23 and ratingCount 5 → average 4.6, count 5.
  The app shows "⭐ 4.6 (5)". Before any rating: average null → show "New driver".


## 9. SURGE & THE PRIORITY FEE — on/off + the 50/50 split

WHY: when many riders want a keke and few are online, the optional priority fee
lets a rider "skip the queue", and half of it becomes a bonus that pulls more
drivers online. Base FCFS always still works — non-payers are never stranded.

HOW SURGE TURNS ON/OFF (evaluated per pickup zone over a rolling 2-minute window):
  • Turns ON  when: pending_requests >= 3  AND  pending_requests > available_seats * 1.5
  • Turns OFF when: pending_requests <= available_seats * 1.2
  • Between those two bands it HOLDS its previous state (hysteresis — stops it
    flickering on/off). The state is stored per zone so it persists between checks.
  "pending_requests" = rides from that pickup stop in "requested"/"assigned" in the
  last 2 minutes. "available_seats" = sum of FREE seats across online kekes
  (capacity − seatsTaken) — pooling means an online keke with open seats still
  counts as available capacity, not just as one vehicle.

FRONTEND behaviour:
  • On Ride Options, call GET /surge/<fromStop> (it re-evaluates live now).
  • surge "off" → HIDE the priority control entirely; do not send priorityFee.
  • surge "on"  → SHOW the optional priority stepper ("skip the queue"); if the
    rider sets it, send priorityFee (KOBO) in POST /rides. The backend honors it if
    surge is on OR was on within ~60s (grace, §20 — covers surge flipping off in
    the seconds before the rider taps Confirm); otherwise it's ignored (set to 0).
  • priorityFee is CAPPED — an over-cap value is rejected (400). Keep your stepper
    within the cap.

THE SPLIT (when a priority fee is paid during surge):
  • Driver's share = 50% of the priority fee → broadcast to the driver as a
    "🔥 surge bonus +₦X" line in their Telegram dispatch. (A real tip.)
  • Platform's share = the other 50% → the service/priority fee.
  The framing is always "skip the queue", never "pay or wait".


## 10. INCIDENTS / SOS / AI TRIAGE / ALERTA → TELEGRAM

Flow for /sos and /incidents/report:
    event → AI triage → save incident → Alerta → SUG Security Telegram group

  • AI triage (Google Gemini) reads: the type, the message, the TIME OF DAY, the
    location link, and the ride id. It returns: a severity (critical/high/medium/
    info), a one-line actionable SUMMARY, a recommended ACTION, a false-alarm
    flag, and a confidence number. Night + off-route escalates severity.
  • The incident is saved to Firestore (incidents collection).
  • Alerta sends the AI summary + meta (incident id, ride, a Google Maps location
    link, time, AI confidence) to the SUG Security Telegram group.
  • A likely false alarm is STILL sent, just tagged "(AI: possible false alarm)" —
    we never silently drop a possible real emergency.
  • (§20.8) THE AI CANNOT SINK AN SOS: if the LLM errors or times out, triage falls
    back to a safe default (critical for SOS) and the incident is STILL saved and
    STILL sent to Telegram. A Gemini outage can never turn an SOS into a dead 500.
  • /sos and /incidents/report are rate-limited (429) so a stuck client can't spam
    the security group or the LLM bill.

Security responds in Telegram — there's no required app screen for them (a web
dashboard is optional/later).


## 11. TELEGRAM HANDSHAKE (chatId) — needed for pings to actually deliver

A Telegram bot CANNOT message someone who hasn't started a chat with it. So:
  • SUG SECURITY group pings (SOS / incidents) use ALERTA_TELEGRAM_TARGET (a
    backend env value) — works as soon as that's configured. No per-user step.
  • RIDER pings (bus proximity) and DRIVER dispatch go to that person's OWN
    Telegram chatId, which must be stored on their doc:
        users/{uid}.chatId      (rider, for bus proximity)
        drivers/{uid}.chatId     (driver, for dispatch / surge bonus)
  • Until a user connects Telegram, those personal pings are simply skipped
    (the backend checks for chatId and no-ops if it's missing — it never errors).

WHAT THE FRONTEND DOES for the handshake (the "Connect Telegram" step):
  (§20.9 — the deep link now uses a ONE-TIME NONCE, not the raw uid.)
  1. Show a "Connect Telegram" button (Notifications / Profile screen).
  2. Ask the backend for a one-time link, then open it:
        const { url } = await api("/me/telegram-link", "POST");
        Linking.openURL(url);   // https://t.me/<Bot>?start=<one-time-nonce>
  3. The user presses START in Telegram.
  4. Telegram calls our backend's POST /telegram/webhook with "/start <nonce>" and
     the user's chat id. The backend resolves the nonce → the uid (single-use,
     short-lived), stores chatId on users/{uid} (and on drivers/{uid} if that user
     is also a driver) and replies "✅ connected".
  5. From then on, personal pings (bus proximity, driver dispatch) reach them.
  The app does NOT call /telegram/webhook itself — Telegram does. The app's job is
  steps 2–3. (Reflect "connected" by watching users/{uid}.chatId in Firestore.)
  WHY THE NONCE: uids leak (a rider sees a driverId in the ride response). The old
  raw-uid link let anyone press Start with someone else's uid and STEAL their
  dispatch channel. The nonce is unguessable and single-use, so that's closed.

  BACKEND ONE-TIME SETUP (not per user): register the webhook with Telegram once
  after deploy — setWebhook(<https-url>/telegram/webhook, TELEGRAM_WEBHOOK_SECRET).
  Needs TELEGRAM_BOT_TOKEN + TELEGRAM_WEBHOOK_SECRET in the backend env. Telegram
  requires an HTTPS url, so for local testing use a tunnel (e.g. ngrok).


## 12. FULL END-TO-END SCENARIOS

A) RIDER books a keke (the happy path):
   1. Splash → has Firebase session? → Home/Map.
   2. Home: subscribe to RTDB for live keke markers (Firebase, not us).
   3. Tap Book → pick From "seet", To "library", seats (1–4), payMethod "naira".
   4. Ride Options: GET /surge/seet. If "on", show priority stepper. Show
        fare = seats × seat-fare so the total is clear before confirming.
   5. Confirm → POST /rides { fromStop, toStop, seats, payMethod, priorityFee? }
        → get { rideId, driverId, etaMin, fare, seats, seatsTaken, pooled,
                expiresAt, stranded }.
        • stranded:true → no keke; show "we've flagged it", let them wait/cancel. STOP.
        • else pooled=true → "you're sharing this keke"; false → "your keke is on
          the way" (a NEW pool also triggers the driver's Telegram dispatch).
        • Note expiresAt: the seat is held ~3 min — go to Payment NOW.
   6. Payment: POST /payments/init { rideId } → open checkoutUrl → user pays →
        POST /payments/verify { reference } → paid:true. (If they abandon here, the
        ride auto-expires and the seat frees — status flips to "expired".)
   7. Live Tracking: subscribe to Firestore rides/{rideId} for status; subscribe
        to RTDB for the driver's moving marker; show driver card with
        GET /drivers/:id/rating. (If the driver cancels, status flips back to
        "assigned" with a NEW driverId — you were auto re-matched; just keep watching.)
   8. At dropoff (after status is "started"): scan the driver's QR → POST
        /rides/:id/complete { qrToken }. Camera won't focus? "Enter PIN" → { pin }.
        → { ok, fare }. (402 = payment not confirmed; 409 = driver hasn't started.)
   9. Trip Complete: POST /rides/:id/rate { stars, comment? } → Done → Home.

B) DRIVER (keke):
   0. ONE-TIME: POST /drivers/register { name, plate } (must be whitelisted). Also
      connect Telegram via POST /me/telegram-link so dispatches reach you.
   1. Login (Firebase). Driver Home.
   2. Go Online: POST /drivers/online { online:true, lat, lng }.
   3. While online: POST /drivers/location { lat, lng } EVERY FEW SECONDS (+ RTDB) —
      this is the heartbeat; go quiet >2 min and you stop getting pools.
   4. Get a Telegram dispatch "📍 New pickup (ride <rideId>): SEET → Main Library"
      (+ surge bonus line if any) → call GET /drivers/me/rides to open the trip.
   5. En route to pickup: POST /rides/:id/status { status:"arriving" }.
      At pickup, rider(s) on board: POST /rides/:id/status { status:"started" }
      (on a shared keke this advances all PAID pooled riders at once). NOTE: you
      can't advance a rider who hasn't PAID (402) — payment secures the seat first.
   6. At dropoff: GET /rides/:id/qr → render qrToken as a QR + show the pin → each
      rider scans/types to complete their own seat.
   7. Each completion credits your earnings ledger (GET /drivers/me/earnings). Repeat.
      Broke down? POST /rides/:id/cancel → the rider is auto re-matched to another keke.

C) RIDER tracks a bus:
   1. Bus tab → GET /buses/routes → pick route "town-a" and a stop.
   2. Subscribe to RTDB for the live bus marker.
   3. For ETA: take the bus's lat/lng from RTDB → GET /buses/routes/town-a/eta
      ?lat=..&lng=.. → show etaMin to the chosen stop.
   4. Optional: POST /buses/proximity { routeId, stopId } + connect Telegram →
      get a "🚌 Bus approaching" ping when it nears the stop.

D) BUS DRIVER:
   1. Login. While driving the route, POST /buses/location { routeId, lat, lng }
      periodically (+ RTDB). This both updates position and fires rider proximity
      pings automatically.

E) SOS (any time):
   1. Tap SOS → confirm → POST /sos { lat, lng, rideId? } → { incidentId }.
   2. AI triages, Alerta posts to the SUG Security Telegram group.
   3. Show "help has been alerted".


## 13. WHAT IS NOT BUILT YET (say this honestly in the demo)

  • No /signup, /login, or /users endpoint — identity is pure Firebase, and the
    APP writes the users/{uid} profile doc on signup. (Stops, however, DO have an
    endpoint now: GET /stops.)
  • Telegram chatId capture IS wired now (POST /telegram/webhook + the t.me
    deep-link in §11). It needs TELEGRAM_BOT_TOKEN + TELEGRAM_WEBHOOK_SECRET set
    and the webhook registered once (setWebhook). Until a user completes the
    /start handshake, their personal pings are simply skipped (no error). The SUG
    Security group target is separate (ALERTA_TELEGRAM_TARGET) and works on its own.
  • cNGN / Solana (payMethod "cngn") is accepted by the schema but the on-chain
    payment path is NOT implemented — naira (Monnify) is the working path. NOTE:
    the payment gate on completion currently covers the NAIRA path; the cNGN path
    (todo.md) will need its own paid-confirmation before it can gate completion.
  • DRIVER PAYOUT is a LEDGER, not a real bank transfer. On completion we credit the
    driver's earnings (GET /drivers/me/earnings); an actual Monnify DISBURSEMENT to
    the driver's account (and the bank-details capture it needs) is a future step.
    Same for REFUNDS on a driver-cancel-after-pay — flagged (refundPending), not yet
    sent. (§20.2/§20.4)
  • Live positions are read by the app from Firebase RTDB; the backend does not
    serve a "live positions" endpoint (by design).
  • "town" stop coords and the single sample bus route are PLACEHOLDERS — replace
    with the real campus/town coordinates and the real SUG route list.
  • THE DRIVER WHITELIST source is a decision to finalise: DRIVER_WHITELIST env
    (comma-separated emails) for the demo, or an SUG-seeded allowedDrivers Firestore
    collection for production. (§20.6)
  • TTL / heartbeat / stale-sub sweeps are LAZY (enforced on the next read/booking),
    not a background cron — fine at campus scale, revisit if load grows. (§20.1/20.5/20.13)
  • Firestore composite indexes: the surge query, the one-active-ride query, and the
    driver's-active-rides query filter + range, so each may need an index the first
    time it runs — Firestore prints a one-click "create index" link in the logs.

===============================================================================
 End of guide. Endpoint quick-reference also lives in docs/API.md; the contract
 summary for the app lives in docs/BACKEND_INTEGRATION.md.
===============================================================================
