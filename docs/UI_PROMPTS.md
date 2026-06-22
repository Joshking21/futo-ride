# FUTO Keke App — UI Generation Prompts (mobile)

**How to use:** attach your chosen Dribbble image, prepend the **base line** below to a screen block, and send. Use the **same inspiration image + same base line for every screen** so the whole app looks consistent.

**Base line (prepend to each):**
> *Using the attached image as style and layout inspiration, design a single mobile app screen in portrait. Keep its visual style, spacing, type, and vibe. Screen: [NAME]. It needs:*

---

## RIDER SCREENS

**1. Splash** — centered app logo, app name, a subtle loading indicator, clean minimal background.

**2. Sign Up** — title, fields for full name / email / password / confirm password, a "Sign up with Google" button, a primary Sign Up button, an "Already have an account? Log in" link.

**3. Log In** — title, email + password fields, a "Log in with Google" button, a primary Log In button, a "Forgot password?" link, a "Create account" link.

**4. Home / Live Map** — full-screen map with small keke/bus markers and a user-location dot, a "Where to?" book bar near the bottom, a Keke/Bus toggle, a tiny "kekes nearby" count, a floating SOS button, and a bottom nav (Home · Rides · Notifications · Profile).

**5. Book a Ride** — a small map preview on top, a "From" building selector and a "To" building selector (dropdown style), a Keke/Bus toggle, and a "Find ride" button.

**6. Ride Options / Confirm** — a card for the matched keke showing ETA + distance, the fare in naira, an optional "priority — skip the queue" toggle, a payment method selector (Naira / cNGN), and a Confirm button.

**7. Payment** — an amount summary (fare + any priority fee), payment options (card, bank transfer, cNGN wallet), a Pay button, and a small secure/processing indicator.

**8. Live Tracking** — a map with a keke icon moving toward the pickup, an ETA countdown, a driver card (name, plate, vehicle, star rating, call icon), a trip-status bar (assigned → arriving → arrived), a Cancel link, and a prominent SOS button.

**9. Scan QR to Complete** — a centered camera scanner frame, the instruction "Scan the code on your driver's phone", and a small "enter code manually" fallback link.

**10. Trip Complete / Receipt** — a success checkmark, a fare breakdown, payment method, a driver summary row, a 5-star rating row with an optional comment box, and a Done button.

**11. SOS / Safety overlay** — a bold emergency screen, a large "Send SOS" button, the line "This alerts campus security with your live location", a small map of the current location, and a Cancel button.

**12. Notifications** — a list of notification rows with icons and timestamps, plus a "Notify me when a keke or bus is near [building]" card with a building picker and a "Connect Telegram" button.

**13. Profile / Account** — an avatar with name, email and role; a settings list (payment methods, Telegram connection status, notification preferences); and a Log out button.

**14. Ride History** — a scrollable list of past rides, each row showing from → to, date, fare, driver, and a status badge; rows are tappable.

---

## DRIVER SCREENS

**15. Driver Home / Status** — a large Online/Offline toggle, the driver's position on a map, a "today's earnings" summary card, an incoming-request area, and a simple bottom nav.

**16. Driver — Active Trip** — pickup and dropoff building names, the rider's first name, a Navigate button, and status action buttons (Arrived → Start → At dropoff). (No tip/bidding info shown.)

**17. Driver — Completion QR** — a large centered QR code, a trip summary above it (route + fare), and a "Waiting for rider to scan…" status line.

**18. Driver — Earnings** — a balance card on top, a list of completed trips with payout amounts, and a Cashout button.

---

## OPTIONAL

**19. Permissions Onboarding** — a clean screen requesting location + notification access, a friendly icon/illustration, one explanatory line, and an Allow button.

> *Admin / SUG security is web + optional and mostly lives in Telegram — skip it for the mobile set.*

---

**Tip:** generate them in this order and keep the same inspo image throughout — if one screen drifts in style, regenerate it rather than letting the set become inconsistent.
