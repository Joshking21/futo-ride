# FUTO Keke App — Frontend Screen Specifications (v1)

> **Purpose:** what each screen must *contain and do* — elements, data, actions, states — **not** colors, fonts, or visual styling (you'll design those).
> **Use:** design each screen → feed designs to Gemini to replicate → hand data/actions to Claude for the backend (each screen's *data* and *actions* map to API endpoints later).
> **Frontend:** React Native (Expo) + NativeWind. **Auth:** Firebase Auth (email/password + Google).
> **MVP** = build first. **Optional** = after the core + Alerta + AI are done.

---

## Screen Map (navigation flow)

```
Splash
 ├─ (no session) → Login ⇄ Sign Up
 └─ (session) → Home/Map
                 ├─ Book Ride → Ride Options → Payment → Live Tracking → Scan QR → Trip Complete → Home
                 ├─ Notifications (+ proximity opt-in)
                 ├─ Ride History → Ride Detail
                 └─ Profile

SOS overlay  → reachable from Home + Live Tracking (always one tap away)

DRIVER MODE
 Driver Home (online/offline) → Active Trip → Show Completion QR → Earnings
```

---

## Global / Shared Components

- **Bottom navigation** (rider): Home/Map · Rides · Notifications · Profile.
- **Persistent SOS button** — always reachable on Home and Live Tracking (one tap to the SOS overlay).
- **In-app notification banner / toast** — for FCM messages while the app is open.
- **Loading, empty, and error states** — every screen that fetches data needs all three.

---

## RIDER SCREENS

### 1. Splash / Launch — *MVP*
- **Purpose:** entry; decide where to send the user.
- **Elements:** app logo/name.
- **Logic:** if a Firebase session exists → Home; else → Login.
- **States:** brief loading while checking session.

### 2. Sign Up — *MVP*
- **Purpose:** create an account.
- **Elements:** full name, email, password, confirm password; **Google sign-up** button; "already have an account? Log in" link; terms checkbox.
- **Actions:** submit → create Firebase user → Home.
- **States:** field validation errors, submitting/loading, auth error (eg email already used).

### 3. Log In — *MVP*
- **Purpose:** return access.
- **Elements:** email, password; **Google** button; "forgot password?"; "no account? Sign up" link.
- **Actions:** submit → Home.
- **States:** validation, loading, wrong-credentials error.

### 4. Home / Live Map — *MVP (core)*
- **Purpose:** see nearby vehicles and start a booking.
- **Elements:** map with **live keke/bus markers** + user-location marker; count of nearby vehicles; vehicle-type toggle (**Keke / Bus**); prominent **"Where to?" / Book** entry; SOS access; bottom nav.
- **Data shown:** live vehicle positions (realtime), user location.
- **Actions:** tap Book → Book Ride; toggle keke/bus; (optional) tap a marker for basic info.
- **States:** locating user, no vehicles nearby (empty), location-permission denied.

### 5. Book a Ride — *MVP (core)*
- **Purpose:** choose origin and destination.
- **Elements:** **From** building selector (defaults to nearest stop), **To** building selector (dropdown of campus stops), vehicle type, **Find ride** button.
- **Data shown:** list of campus buildings/stops.
- **Actions:** pick from/to → Find ride → Ride Options.
- **States:** validation (From ≠ To), no stops loaded.

### 6. Ride Options / Confirm — *MVP (core)*
- **Purpose:** confirm the matched ride and how to pay.
- **Elements:** nearest available keke(s) with **ETA + distance**; **fare** (base ₦); **IF surge is active:** optional **priority-fee** toggle/stepper (with a plain note like "skip the queue"); **payment method** selector (**Naira** / **cNGN**); **Confirm** button.
- **Data shown:** matched driver/vehicle, ETA, fare, surge state.
- **Actions:** set priority (if shown), choose pay method, confirm → Payment.
- **States:** no kekes available, surge banner on/off, recalculating fare.

### 7. Payment — *MVP (Naira) · cNGN optional*
- **Purpose:** pay so the fare is collected.
- **Elements:** amount summary (fare + priority fee); **Naira:** Monnify checkout (card / bank transfer / virtual account); **cNGN (optional):** wallet balance + pay button (Privy loads here only); pay action.
- **Actions:** pay → on success, fare locked → Live Tracking.
- **States:** processing, success, failure + retry.

### 8. Live Tracking — *MVP (core)*
- **Purpose:** watch the keke approach and ride.
- **Elements:** map with keke moving toward pickup; **driver card** (name, plate, vehicle, rating); **ETA countdown**; **trip status** (assigned → arriving → arrived → started); **Cancel ride**; **persistent SOS**.
- **Data shown:** live driver position, status, ETA (realtime).
- **Actions:** cancel ride, trigger SOS; at dropoff → Scan QR.
- **States:** searching/assigning, arriving, in-trip, cancelled.

### 9. Scan QR to Complete — *MVP (core)*
- **Purpose:** confirm trip end and trigger driver payout.
- **Elements:** camera scanner; instruction ("scan the code on your driver's phone"); manual code-entry fallback.
- **Actions:** scan valid code → confirm → Trip Complete.
- **States:** scanning, success, invalid code, camera-permission denied.

### 10. Trip Complete / Receipt — *MVP*
- **Purpose:** close the loop and rate.
- **Elements:** fare breakdown; payment method; driver; **rate driver** (stars + optional comment); **Done**.
- **Actions:** submit rating → Home.

### 11. SOS / Safety Overlay — *MVP (core — this is your prize layer)*
- **Purpose:** raise an incident to SUG security.
- **Elements:** large **Send SOS** confirm; plain note that it alerts campus security with your live location; cancel.
- **Actions:** confirm → fires the incident (backend → AI triage → Alerta → security channel).
- **States:** sending, sent-confirmation ("help has been alerted").

### 12. Notifications — *MVP (list) · proximity opt-in MVP*
- **Purpose:** see alerts + set up proximity pings.
- **Elements:** list of past notifications; **proximity opt-in**: "notify me when a keke/bus is near [building]" with a building picker and a **Connect Telegram** step (deep-link to the bot → press Start).
- **Actions:** toggle proximity alerts, connect Telegram.
- **States:** Telegram not yet connected, empty list.

### 13. Profile / Account — *MVP*
- **Purpose:** manage account.
- **Elements:** name, email, role; payment methods; Telegram connection status; (wallet info if cNGN used); **Log out**.
- **Actions:** edit basics, log out.

### 14. Ride History — *MVP*
- **Purpose:** review past rides.
- **Elements:** list (From→To, date, fare, driver, status); tap a row → Ride Detail/receipt.
- **States:** empty (no rides yet).

---

## DRIVER SCREENS

### 15. Driver Home / Status — *MVP*
- **Purpose:** go on/off duty and wait for assignments.
- **Elements:** **Online/Offline** toggle; own location on map; today's earnings summary; incoming-assignment area.
- **Data shown:** own GPS, online state, earnings.
- **Actions:** toggle availability.
- **States:** offline, online-waiting, assignment-incoming.

### 16. Driver — Active Trip — *MVP*
- **Purpose:** execute the assigned ride.
- **Elements:** pickup building, dropoff building, rider name; navigate link; status buttons (**Arrived → Start → At dropoff**). *(Driver does not see who tipped — assignment only.)*
- **Actions:** update status; at dropoff → Show Completion QR.
- **States:** heading to pickup, in-trip.

### 17. Driver — Completion QR — *MVP*
- **Purpose:** let the rider scan to release payment.
- **Elements:** **per-trip QR code**; trip summary; "waiting for rider to scan" indicator.
- **Actions:** none (waits for scan) → on confirm, payment releases → next.
- **States:** waiting, confirmed/paid.

### 18. Driver — Earnings — *Optional*
- **Purpose:** track money.
- **Elements:** completed trips + payouts list; balance; cashout (if cNGN).

---

## OPTIONAL / LATER

### 19. Permissions Onboarding — *Optional but recommended*
- Location permission + notification permission primers (shown before the map first loads).

### 20. Admin / SUG Security Dashboard (web) — *Optional*
- **Note:** most incident response happens in the **Telegram** channels via Alerta, so a dashboard is optional.
- **If built:** live incident feed (mirrors Telegram), fleet map, surge toggle, driver-supply view.

---

## Notes for the Designer

- **Two roles, possibly one app:** rider and driver flows can live in the same app behind a role switch, or split into two. Decide before designing the shells.
- **The SOS path must feel instant and always reachable** — it's the safety story and the prize layer; don't bury it.
- **Realtime screens** (Home map, Live Tracking) update on their own — design for *moving* data (markers shifting, ETA ticking), not static snapshots.
- **Every data screen needs loading / empty / error states** — Gemini will replicate whatever you show it, so design those states explicitly.

*End of v1 screen spec.*
