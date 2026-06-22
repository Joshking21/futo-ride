# AGENTS.md — Operating Manual for AI Coding Agents

> **Audience:** any AI coding agent (Claude Code, Cursor, etc.). Copy or symlink this to `CLAUDE.md` / `.cursorrules` if your tool needs a specific filename.
> **Scope:** the whole monorepo — **frontend** (Next.js App Router UI) and **backend** (Route Handlers / Server Actions). Conventions split by area: backend → `CONVENTIONS.md`, frontend → `FRONTEND_CONVENTIONS.md`. Still build only the slice the human asks for.
> **Golden principle:** this file describes *intent and contracts*, which are stable. It does **not** describe exact current library APIs, which change. **When this file and reality disagree, reality wins — verify, then tell the human.**

---

## 0. STOP — do these three things before writing any code

1. **Ask what to work on.** Do not start coding unprompted. At the start of a session, ask the human *which feature / endpoint / module* they want to tackle, present the options (see the build phases in `docs/PROJECT_PLAN.md`), and **confirm scope** before touching code.
2. **Verify, don't assume.** Before using any library or external service, confirm its *current* API (see §4–5). Never code against remembered signatures.
3. **Plan to document.** You will update docs *after* coding (see §6). Keep notes as you go.

---

## 1. What this project is (summary)

A campus transport app for FUTO students: **hail a keke** (tricycle) building-to-building, **track the town bus** (fixed routes), pay in naira, with a **safety/incident-comms layer**. Two prize targets drive priorities: **Best Alerta Integration** (incident-comms) and **Best AI Project** (AI incident triage). 

**Full detail lives in `docs/PROJECT_PLAN.md`.** Read the relevant section of that plan before implementing a feature. If anything here conflicts with the plan, ask the human which is current.

---

## 2. Architecture boundaries (never blur these)

- **Frontend** handles UI, logs in via **Firebase Auth directly**, and reads **realtime data straight from Firebase** (live positions, ride/bus status, notifications).
- **Backend = Next.js Route Handlers / Server Actions.** It owns: all **secret keys**, **Firebase ID-token verification**, **business logic** (matching, fare, surge), **external calls** (Monnify, Alerta, LLM), and **authoritative writes** via the Firebase **Admin SDK**.
- **Rule of thumb:** touches a secret or a trust decision → backend. Just shows the user live data → frontend reads Firebase directly (guarded by Security Rules).
- **Do not** put business logic, secrets, or Admin-SDK calls in client code. **Do not** issue your own auth tokens — Firebase issues identity; the backend only *verifies* it.

### Frontend specifics (full detail in `FRONTEND_CONVENTIONS.md`)

- **Match the human's approved designs.** UI comes from the generated/approved screens — don't invent layouts, colors, or flows. If a screen's design is missing, ask for it.
- **Realtime *reads* → Firebase client SDK** (live map, ride/bus status, notifications), inside client components/hooks.
- **Backend calls (writes/actions) → the typed `/lib/api.ts` client**, never scattered raw `fetch`. The shared `/types` are the contract.
- **Client vs Server Components:** default to Server Components; add `"use client"` only for interactivity, state, browser APIs, or Firebase subscriptions.
- **Mobile-first, portrait.** Every data screen handles **loading / empty / error** states.
- **No secrets, no business logic on the client.** Only `NEXT_PUBLIC_*` is allowed.

---

## 3. The Golden Rules

1. **Ask first, then scope tightly.** One feature at a time. Confirm the boundary of the task before coding. Don't refactor or touch unrelated files without asking.
2. **Verify, never assume (anti-staleness).** Library versions, SDK method names, and third-party endpoints change. Always confirm against the *installed version* and *official docs* before use. If you can't verify, say so and ask — do not guess.
3. **No invented anything.** Never fabricate API endpoints, request/response shapes, env-var names, config keys, or function signatures. Unknown → look it up or ask.
4. **Secrets are server-side only.** Never hardcode keys, never commit `.env`, never expose a secret to the client. Only `NEXT_PUBLIC_*` (Firebase web config) is allowed client-side.
5. **Validate + type everything.** Every endpoint validates its input (Zod) and returns the shared response shape. Types live in `/types`.
6. **Document after coding (the human values this).** After implementing: update `docs/API.md`, add JSDoc to exported functions, and leave a one-line summary of what changed. See §6.
7. **Stay in phase.** Priorities are Alerta + AI first. **Escrow is cut.** Solana/cNGN is optional and cut-first. Don't gold-plate or scope-creep.

---

## 4. Verification checklist — run this before coding a feature

- [ ] Read the matching section of `docs/PROJECT_PLAN.md`.
- [ ] Check `package.json` for the **installed version** of every library you'll use.
- [ ] Check `.env.example` for the env vars the feature needs (add any missing as *names only*).
- [ ] Check `/types` for the data shapes you'll touch.
- [ ] For any **external service**, open its **official docs** and confirm the current endpoint / SDK method / auth header. (See §5.)
- [ ] If this doc or the plan disagrees with the installed library or official docs → **the library/docs win.** Flag the discrepancy to the human.

---

## 5. External services — what we believe vs. where to verify

> The "believed" column is grounded but **may be stale**. Always confirm the **WHERE TO VERIFY** column before integrating. Treat the ⚠️ HIGH-risk rows as untrusted until checked.

| Service | What we believe (verify anyway) | Where to verify | Staleness risk |
|---|---|---|---|
| **Firebase (Admin + client)** | Admin SDK for backend writes/token-verify; client SDK for reads/auth | Official Firebase docs; installed `firebase` / `firebase-admin` version | Medium |
| **Monnify (Moniepoint)** | Sandbox `sandbox.monnify.com`, live `api.monnify.com`; test keys `MK_TEST_…`, live `MK_PROD_…` | Monnify developer docs (confirm auth flow, init-transaction + disbursement endpoints) | ⚠️ HIGH |
| **Alerta (Encrisoft)** | Base `https://api.alerta.encrisoft.com/v2`; headers `x-api-key` + `x-api-secret`; send via `POST /v2/telegram/send`; channels limited to Slack/Discord/Teams/Telegram (no WhatsApp/native push) | `docs.encrisoft.com` (Alerta API reference) | ⚠️ HIGH |
| **Privy** (only if Solana in scope) | Embedded Solana wallet + login; point RPC at devnet | Official Privy docs; installed SDK version | ⚠️ HIGH |
| **LLM API (AI triage)** | One call: input incident context → output severity + summary + action | The chosen provider's current SDK/docs | Medium |
| **Google Maps** | JS SDK for the map; billing account must be attached even for free tier | Google Maps Platform docs | Low |
| **Solana / cNGN** (optional) | Devnet only; mint a **mock** cNGN SPL token for the demo; free devnet SOL from the faucet | Solana + SPL-token docs; do not use a mainnet token | ⚠️ HIGH |

If a service isn't connected or you can't reach its docs, **stop and ask** — do not stub it with invented endpoints.

---

## 6. Interaction protocol (every session)

- **Start:** ask which part to work on → confirm scope → run the §4 checklist.
- **During:** verify before using any library; if uncertain, ask rather than guess; keep the change small and within scope.
- **After coding, always:**
  1. Update **`docs/API.md`** — one entry per endpoint touched (see format below).
  2. Add/refresh **JSDoc** on every exported function (purpose, params, returns, throws).
  3. Give the human a **2–4 line summary**: what changed, which files, what to test, anything you had to verify or that surprised you.
- **When blocked or unsure:** state what you tried, what's ambiguous, and ask. Never paper over uncertainty with a plausible-looking guess.

**`docs/API.md` entry format (keep human-readable, no Swagger needed — see §7):**
```
### POST /api/rides
Auth: required (Firebase ID token)
Body:  { fromStop: string, toStop: string, payMethod: "naira" | "cngn", priorityFee?: number }
200:   { ok: true, data: { rideId, driverId, etaMin, fare } }
4xx:   { ok: false, error: string }
Notes: validates from ≠ to; assigns nearest keke (FCFS); surge fee only if active.
```

---

## 7. Documentation strategy — no Swagger (for now)

We deliberately **do not** add Swagger/OpenAPI tooling yet, because:
- It's extra setup that doesn't pay off at hackathon scale.
- **Zod schemas already are the contract** (validation + inferred types), and a human-readable **`docs/API.md`** (maintained by you after each task) covers the rest.
- If interactive API docs are ever wanted, OpenAPI can be **generated from the existing Zod schemas later** (e.g. a zod-to-openapi step) with minimal effort — so keep schemas clean and colocated to make that easy.

So: **Zod = contract, `docs/API.md` = the human doc, JSDoc = inline.** That's the documentation bar for every task.

### How the frontend knows what to wire (without Swagger)

This is a **monorepo**, so the contract is shared code, not a separate spec — which is stronger than Swagger because the compiler enforces it and it can't drift:

1. **Shared types are the contract.** The frontend imports the **same `/types` (and Zod-inferred types)** the backend uses. Wire a request/response wrong → it **won't compile**.
2. **`docs/API.md` is the index** — every endpoint's path, auth, body, responses, notes. Read it to see what exists.
3. **Typed API client (`/lib/api.ts`)** — thin typed `fetch` wrappers both sides import, so the frontend calls e.g. `api.bookRide(input)` with full autocomplete, never hand-writing URLs or guessing payloads.

**Frontend wiring path:** read `API.md` → import the shared types → call the typed client. When you add or change an endpoint, you **must** keep `/types`, `docs/API.md`, and `/lib/api.ts` in sync — that trio *is* the frontend's contract.

> Swagger only earns its place if the frontend becomes a separate repo / team / language, or there are external API consumers. Not our case — so don't add it.

---

## 8. Environment variables (proposed names — confirm against the real `.env.example`)

Names only. Never write real values here or in any committed file.
```
# Firebase (client — safe to expose)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_...=
# Firebase Admin (server — SECRET)
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
# Monnify (server — SECRET)
MONNIFY_API_KEY=
MONNIFY_SECRET_KEY=
MONNIFY_CONTRACT_CODE=
MONNIFY_BASE_URL=        # sandbox vs live
# Alerta (server — SECRET)
ALERTA_API_KEY=
ALERTA_API_SECRET=
ALERTA_TELEGRAM_TARGET=  # security group identifier
# LLM (server — SECRET)
LLM_API_KEY=
# Google Maps (client)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```
Confirm the actual variable names with the human / the real `.env.example` before relying on them. If a needed var is missing, add it to `.env.example` (name + comment, no value) and tell the human.

---

## 9. Definition of Done (every backend task)

- [ ] Input validated with Zod; bad input returns the standard error shape.
- [ ] Protected routes verify the Firebase ID token before doing anything.
- [ ] No secret ever reaches the client; no key hardcoded.
- [ ] Types updated in `/types`; no `any` without a written reason.
- [ ] Errors caught; nothing leaks stack traces or secrets to the client.
- [ ] External-service calls were **verified against current docs** before writing.
- [ ] `docs/API.md` + JSDoc updated; summary given to the human.
- [ ] Change stayed inside the agreed scope.

---

*This manual is intentionally light on version-specific detail so it doesn't go stale. The contracts and boundaries are the stable part; everything version-specific must be verified live.*
