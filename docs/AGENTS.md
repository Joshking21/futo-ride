# AGENTS.md — Operating Manual for AI Coding Agents

> **Repo:** `futo-ride` — a **monorepo**: `apps/api` (our **Fastify** backend) + `apps/mobile` (the **Expo / React Native** app, owned by the frontend dev, with its own setup and conventions).
> **Your domain is the backend (`apps/api`)** unless explicitly told otherwise. Do **not** restructure `apps/mobile` or impose conventions on it — it's the frontend dev's app.
> **Golden principle:** this file describes *intent and contracts* (stable). It does **not** describe exact current library APIs (those change). **When this file and reality disagree, reality wins — verify, then tell the human.**

---

## 0. STOP — before writing any code

1. **Ask what to work on.** Don't start unprompted. Confirm the feature/endpoint and its scope (see phases in `docs/PROJECT_PLAN.md`).
2. **Verify, don't assume.** Confirm any library/SDK/endpoint against its *installed version* and *official docs* (§5).
3. **Plan to document.** You update docs *after* coding (§7).

---

## 1. What this project is

A campus transport app for FUTO students: **hail a keke** building-to-building, **track the town bus** (fixed routes), pay in naira, with a **safety/incident-comms layer**. Prize targets: **Best Alerta Integration** + **Best AI Project**. Full detail in `docs/PROJECT_PLAN.md` — read the relevant section before building.

---

## 2. Repo layout & ownership

```
futo-ride/
├── apps/
│   ├── api/                ← OUR backend (Fastify, TypeScript). YOUR workspace.
│   │   └── src/
│   │       ├── lib/        http.ts · firebase-admin.ts · auth.ts   (Layer 0)
│   │       ├── types/      shared data models
│   │       ├── routes/     Fastify route modules
│   │       └── server.ts   Fastify bootstrap
│   └── mobile/             ← frontend dev's Expo + NativeWind app. NOT your domain.
├── docs/
│   ├── PROJECT_PLAN.md            the what & why
│   ├── BACKEND_INTEGRATION.md     how mobile calls the backend (the contract)
│   ├── FRONTEND_SCREENS.md        screen requirements
│   ├── UI_PROMPTS.md              design generation aid
│   └── API.md                     live endpoint registry (you maintain)
├── AGENTS.md                this file
├── CONVENTIONS.md           backend coding conventions
├── .env.example            env var names (no values)
└── package.json            workspace root
```

**Ownership rules:**
- Backend work (`apps/api`) → follow `CONVENTIONS.md`.
- **Never edit `apps/mobile`** unless explicitly asked — it has its own tooling (Expo, NativeWind, expo-router) and its own conventions. We don't govern it; we just expose a clean API to it.
- The only thing the mobile app needs from us is the **contract**: `docs/BACKEND_INTEGRATION.md` + `docs/API.md`. Keep those accurate.

---

## 3. Architecture boundaries

- **Mobile ↔ backend over HTTP.** The mobile app attaches the user's **Firebase ID token**; the backend **verifies** it (Admin SDK) and runs the logic.
- **Backend owns:** secret keys, token verification, business logic (matching, fare, surge), external calls (Monnify, Alerta, LLM), and authoritative **writes** via the Firebase Admin SDK.
- **Mobile owns:** all UI, login (Firebase Auth), and **realtime reads** straight from Firebase (live positions, ride/bus status). That's the frontend dev's concern — not ours.
- **Never** put secrets or business logic where the client can reach them. The backend **verifies** tokens; it never **issues** them.

---

## 4. The Golden Rules

1. **Ask first, scope tightly.** One feature at a time; confirm boundaries; don't touch unrelated files (and never `apps/mobile`).
2. **Verify, never assume.** Versions and third-party endpoints drift — confirm before use (§5). Can't verify → ask, don't guess.
3. **No invented anything.** Never fabricate endpoints, request/response shapes, env names, or signatures.
4. **Secrets server-side only.** Never hardcode keys, never commit `.env`.
5. **Validate + type everything.** Every route validates input (Zod) and returns the shared envelope. Types live in `apps/api/src/types`.
6. **Document after coding** (§7) — update `docs/API.md` **and** `docs/BACKEND_INTEGRATION.md` when an endpoint changes, since the mobile dev reads the latter.
7. **Stay in phase.** Alerta + AI first. Escrow is cut. Solana/cNGN is optional/cut-first.

---

## 5. Verification checklist (before coding a feature)

- [ ] Read the matching section of `docs/PROJECT_PLAN.md`.
- [ ] Check `apps/api/package.json` for the **installed version** of each library.
- [ ] Check `.env.example` for required vars (add missing ones as *names only*).
- [ ] Check `apps/api/src/types` for the shapes you'll touch.
- [ ] For each external service, open its **official docs** and confirm the current endpoint/SDK/auth (table below).
- [ ] If this doc or the plan conflicts with the installed library → **the library wins.** Flag it.

### External services — verify before integrating

| Service | What we believe (verify anyway) | Where to verify | Risk |
|---|---|---|---|
| **Fastify** | route registration, hooks/preHandler for auth, lifecycle | Fastify docs + installed version | Medium |
| **Firebase Admin** | `verifyIdToken`, Firestore writes (Layer 0 already wires this) | Firebase Admin docs + installed `firebase-admin` | Medium |
| **Partna** (payments) | staging `staging-api.getpartna.com/v4`, headers `x-api-key`+`x-api-user`; `POST /ramp` (onramp/offramp), hosted onramp widget, RSA-PSS webhook. **Verified 2026-07-09.** cNGN unsupported → USDC-on-Solana. Replaces Monnify. | `docs.getpartna.com/v4` | ⚠️ HIGH |
| **Alerta** | `https://api.alerta.encrisoft.com/v2`, headers `x-api-key`+`x-api-secret`, `POST /v2/telegram/send` | `docs.encrisoft.com` | ⚠️ HIGH |
| **LLM (AI triage)** | Google Gemini via `@google/genai`; one call → severity + summary + action (Zod-validated) | Google GenAI SDK/docs | Medium |

> Mobile-side services (`@react-native-firebase`, `react-native-maps`, Privy) are the **frontend dev's** domain — don't wire them from the backend side.

---

## 6. Interaction protocol (every session)

- **Start:** ask which part → confirm scope → run the §5 checklist.
- **During:** verify before using any library; ask when unsure; keep the change small and inside `apps/api`.
- **After coding, always:**
  1. Update **`docs/API.md`** (entry per endpoint — format below).
  2. Update **`docs/BACKEND_INTEGRATION.md`** if the mobile-facing contract changed.
  3. Add/refresh **JSDoc** on exported functions.
  4. Give the human a **2–4 line summary**: what changed, files, what to test, anything verified/surprising.
- **Blocked/unsure:** say what you tried and ask. Never paper over uncertainty with a guess.

**`docs/API.md` entry format:**
```
### POST /rides
Auth: required (Firebase ID token)
Body:  { fromStop: string, toStop: string, payMethod: "naira" | "cngn", priorityFee?: number }
200:   { ok: true, data: { rideId, driverId, etaMin, fare } }
4xx:   { ok: false, error: string }
Notes: from ≠ to; assigns nearest keke (FCFS); surge fee only if active.
```

---

## 7. Documentation strategy — no Swagger

We don't add Swagger/OpenAPI tooling. The mobile dev gets the contract from three things that can't drift out of a working backend:
1. **`docs/BACKEND_INTEGRATION.md`** — base URL, auth, response envelope, how to call each endpoint (the human-readable guide for the frontend dev).
2. **`docs/API.md`** — the live endpoint registry you maintain.
3. **Zod schemas + the `types`** — the actual validated shapes.

If interactive docs are ever wanted, OpenAPI can be generated from the Zod schemas later. Keep schemas clean and colocated to make that easy.

---

## 8. Environment variables (proposed names — confirm against the real `.env.example`)

Server-side, read only in `apps/api`. Never commit values. **The `.env.example` file is the
source of truth** — this list is a summary; reconcile against it.
```
# Firebase Admin (SECRET)
FIREBASE_ADMIN_PROJECT_ID= / FIREBASE_ADMIN_CLIENT_EMAIL= / FIREBASE_ADMIN_PRIVATE_KEY=
# Partna payments (SECRET) — replaces Monnify (§21)
PARTNA_API_KEY= / PARTNA_API_USER= / PARTNA_BASE_URL= / PARTNA_PAY_URL=
PARTNA_WEBHOOK_PUBLIC_KEY= / TREASURY_SOLANA_ADDRESS=
# Alerta (SECRET)
ALERTA_API_KEY= / ALERTA_API_SECRET= / ALERTA_TELEGRAM_TARGET=
# Telegram bot (SECRET) — per-user chat-id capture
TELEGRAM_BOT_TOKEN= / TELEGRAM_WEBHOOK_SECRET=
# LLM / AI triage (SECRET)
LLM_API_KEY= / LLM_MODEL=
# Driver onboarding + lifecycle/fee tunables (optional; defaults in code)
DRIVER_WHITELIST= / PAYMENT_WINDOW_MS= / DRIVER_HEARTBEAT_MS= / SURGE_GRACE_MS=
PRIORITY_FEE_CAP_KOBO= / PLATFORM_FEE_BPS= / CANCELLATION_FEE_KOBO=
# Server
PORT=
```
Layer 0 already reads `FIREBASE_ADMIN_*`. Confirm names against the actual `.env.example` before relying on them; add missing ones (name + comment, no value) and tell the human.

---

## 9. Definition of Done (every backend task)

- [ ] Input validated with Zod; bad input → standard error envelope.
- [ ] Protected routes run `verifyRequest` before any logic.
- [ ] No secret reaches the client; nothing hardcoded.
- [ ] Types updated in `apps/api/src/types`; no `any` without a written reason.
- [ ] Errors caught; no stack traces or secrets leaked.
- [ ] External calls **verified against current docs** before writing.
- [ ] `docs/API.md` (and `BACKEND_INTEGRATION.md` if mobile-facing) + JSDoc updated; summary given.
- [ ] Change stayed inside `apps/api` and inside the agreed scope.

---

*Light on version-specific detail by design. Contracts and boundaries are the stable part; everything version-specific must be verified live.*