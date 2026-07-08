# AUDIT_REPORT.md — Full-Project Audit + Partna Payment-Flow Plan (v7)

> **✅ STATUS (2026-07-09): IMPLEMENTED.** Every §3 finding (C1–C3, H4–H6, M7–M10, N3–N4), the
> Firestore hygiene fixes (§4/§21.6), and the full Partna migration + 95/5 split + withdraw
> (§5 P1–P3) are built and typecheck clean; all docs are updated. See PROJECT_PLAN §21 for the
> shipped summary. This file is retained as the point-in-time audit + verified Partna reference.
>
> **Date:** 2026-07-08 · **Scope:** `docs/` + `apps/api` (backend only; `apps/mobile` untouched per AGENTS.md).
> **Trigger:** decision to scrap **Monnify + cNGN** and rebuild the whole payment flow on **Partna**
> (verified live against `docs.getpartna.com` — every endpoint below was checked, nothing is from memory).
> **Structure:** §1 verified Partna facts → §2 verdict on the Gemini mini-plan → §3 code-logic findings
> (the bugs) → §4 plan/docs findings → §5 the new payment-flow plan → §6 doc/code update checklist.

---

## 1. Partna V4 — verified facts (checked 2026-07-08)

Everything in this section was read directly from the official docs. Sources:
`docs.getpartna.com/v4/documentation/*` and `docs.getpartna.com/api-reference/*`
(index: `docs.getpartna.com/llms.txt`).

**What Partna is.** A payment API connecting African currencies (NGN, KES live; GHS/MWK/ZMW
launching) to stablecoins. Four products: **Onramp** (fiat→crypto), **Offramp** (crypto→fiat),
**Collect & Settle**, **Payout**.

**Auth.** Two headers on every call: `x-api-key` + `x-api-user` (merchant username). No request
signing. Server-side only.

**Base URLs.**
- Production API: `https://api.getpartna.com/v4`
- Staging API: `https://staging-api.getpartna.com/v4` (no real money moves; identical behavior)
- Hosted widget: `https://pay.getpartna.com` / staging `https://staging-pay.getpartna.com`

**The ramp endpoint (the core primitive).** `POST /v4/ramp` with `type: "fiatToCrypto"` (onramp)
or `"cryptoToFiat"` (offramp). Required: `fromCurrency`, `fromNetwork`, `toCurrency`, `toNetwork`,
`rateKey` (from `GET /v4/rate`). Onramp extras: `fromAmount`, `cryptoAddress`, `rampReference`,
`rampExpTime` (default 1 h), `expireAction` (`useCurrentRate` | `deposit`),
`cancelPendingRampRequest`. Offramp extras: `accountName`, `accountNumber`, `bankCode`
(pre-verified via `POST /v4/kyc/resolve-account`; bank list via `GET /v4/bank`).

**Onramp response** = a **virtual bank account** to transfer NGN into: `accountName`,
`accountNumber`, `bankName` (e.g. "Paystack-Titan") + `currentRate`, `toAmount`,
`totalFeesInFromCurrency`, `expiryDate`. The user does a normal bank transfer; on confirmation the
crypto lands at `cryptoAddress` and a webhook fires.

**Hosted onramp widget** (closest analogue to our current Monnify `checkoutUrl`):
`https://pay.getpartna.com/v4/pay/onramp?amount=&from_currency=NGN&to_currency=USDC&to_network=solana&address=<wallet>&merchant=<username>&reference=<hex>`.
Webhook statuses through the flow: `pending → received → processing → completed`.

**Status polling.** `GET /v4/ramp?rampReference=<ref>` returns ramp requests with `status`
(`completed` / `canceled` seen in docs), `confirmed`, amounts, rates, and the deposit account.

**Webhooks.** Events: `Deposit`, `Convert`, `Transfer`, `Withdrawal`, `Onramp`, `Offramp`,
`verification.success`, `verification.failed`. Payload = `{ event, data, signature }`.
**Verification = RSA-PSS + SHA-256 over the JSON-encoded `data` field**, checked against Partna's
environment-specific **public key** — *not* an HMAC like Monnify. Deliveries can repeat →
idempotency by `rampReference`/`sessionId` is on us. Endpoint must 200 fast.

**Balances / treasury alternatives.** `GET /v4/user/balances` (merchant balances per currency),
`POST /v3/transfer/withdraw` (send settled funds out), `convert-currency`, and Collect & Settle
(configure a `creditCurrency` of USD/USDT/USDC and settle collections into the merchant balance).

**Staging/testing (this is our demo path).**
- `POST /v4/mock/fiat-deposit { amount, currency: "NGN" }` — simulates the rider's bank transfer,
  fires the real webhook sequence.
- `POST /v4/mock/deposit { amount, currency }` — simulates a crypto deposit.
- Test KYC: any 11-digit BVN, phone `08030013843`, OTP `123456`.
- Local webhooks: tunnel (ngrok) + Update Webhook URL endpoint.

**Two hard facts that shape the plan:**
1. **cNGN is NOT a supported currency.** Supported: BTC, ETH, USDC, USDT, CUSD, BNB, NGN, KES.
   → every cNGN reference in our docs/todo.md is targeting an asset our processor can't touch.
   **USDC on `solana` IS supported** → USDC-on-Solana replaces cNGN everywhere.
2. **There is no split/multi-recipient field anywhere in the ramp payload.** 100% of an onramp
   lands at the single `cryptoAddress`. Any 95/5 split must happen on our side.

---

## 2. Verdict on the Gemini mini-plan

| Claim | Verdict |
|---|---|
| Partna cannot split a payment at the gateway | ✅ **Confirmed** — no split field in `POST /v4/ramp` |
| `fiatToCrypto` sends 100% to one `cryptoAddress` | ✅ Confirmed |
| Micro-transaction trap (per-ride payouts eaten by transfer fees) | ✅ Sound — ₦150–₦600 fares cannot absorb a per-ride payout fee; and Partna's onramp *also* charges fees per transaction (`totalFeesInFromCurrency`), so per-ride economics are thin even on collection |
| Ledger + batch settlement is the right architecture | ✅ Agreed — and **we already built the ledger** (`earnings` collection + `earningsKobo`, §20.2). The plan slots into existing code |
| Offramp pays a driver's bank from crypto | ✅ Confirmed (`cryptoToFiat` + resolve-account + bank code) |
| Native USDC in a wallet earns nothing; Kamino = V2 talking point only | ✅ Correct — mention in the pitch, do not build |
| "Onramp widget" exists | ✅ Confirmed (`pay.getpartna.com/v4/pay/onramp`, exact params in §1) |

Two things the mini-plan **missed** (they matter for honesty on stage):
- **KYC:** in production every *paying customer* completes a one-time KYC before ramping. Fine in
  staging (mock data), but the production story is "riders onboard once with BVN/phone" — say it,
  don't hide it.
- **FX exposure:** the ledger owes drivers **naira-denominated kobo**, but the treasury holds
  **USDC**. Between collection and withdrawal the platform carries NGN/USDC rate risk (usually in
  our favor as naira weakens, but it's a real exposure — one honest sentence in the pitch).
- Also: an account is limited to **one pending ramp request** at a time
  (`cancelPendingRampRequest`) — relevant if we create ramps under one merchant identity; the
  widget/per-customer-account flow avoids it. Verify against our onboarding when keys arrive.

---

## 3. Code-logic audit — findings (ranked)

> C = critical (money/safety), H = high, M = medium, L = low. File:line refs are current as of
> commit `d84e51b`.

### C1. `payMethod: "cngn"` is a free-ride hole — TODAY, in production paths
`needsPayment()` (`rides.ts:31-33`) returns `true` only for `naira`. A rider who books with
`payMethod: "cngn"` (a valid schema enum) bypasses **every** payment gate: the driver can advance
(`/rides/:id/status` never 402s) and the rider can complete without ever paying — and the driver's
ledger is still credited. FLOW_GUIDE §13 admits it, but it's not a "not built yet" note — it's a
live bypass of §20.2.
**Fix:** removing cNGN (this migration) closes it. Until the Partna path lands, either drop
`"cngn"` from the `BookRide` enum or make `needsPayment` return `true` for any non-`PAID` ride.

### C2. Stranded-ride reuse wipes a paid ride's `paymentStatus` + `refundPending` (double-charge)
Path: rider pays → driver cancels → no re-match → ride goes `requested` with
`paymentStatus:"PAID"`, `refundPending:true` (`rides.ts:264-272`). Rider books again → the
stranded-reuse logic (`rides.ts:58-66`) grabs that doc and **`ref.set(ride)` / `tx.set(rideRef,
ride)` fully overwrites it** (`rides.ts:92`, `159`) with an object that has no
`paymentStatus`/`refundPending`. The PAID stamp and the refund flag are destroyed; the rider is
now asked to pay **again** and the owed refund leaves no trace.
**Fix:** when reusing a ride doc, merge-preserve `paymentStatus`/`refundPending` (and skip
`expiresAt` when already PAID), or only reuse never-paid stranded rides.

### C3. Late payment on an expired ride takes money for a dead ride
`reconcile()` (`payments.ts:18-38`) marks the payment PAID and stamps the **ride** `paymentStatus:
"PAID"` without checking the ride's status. Sequence: rider inits at 2:50, pays at 3:10; the sweep
expires the ride and frees the seat; the webhook then lands → money collected, ride stays
`expired`, no `refundPending`, nobody notified.
**Fix:** in `reconcile`, load the ride; if its status is no longer active
(`assigned|arriving|started`), set `refundPending:true` (and don't clear `expiresAt`). Same logic
carries directly into the Partna webhook handler.

### H4. Rider-cancel of a PAID ride loses the money silently
`rides.ts:286` — the rider-cancel path sets `status:"cancelled"` and pings the driver, but never
sets `refundPending` even when `paymentStatus === "PAID"`. Only the driver-cancel-no-rematch path
flags refunds. Combined with H5 this is the *likely* path a real paid rider hits.
**Fix:** flag `refundPending: ride.paymentStatus === "PAID"` on rider cancel too (arguably minus a
cancellation fee after `started` — product call).

### H5. A vanished driver strands a PAID rider forever (no timeout, no refund)
A PAID ride never expires (`matching.ts:146`) — correct — but if the driver goes offline/stops
heartbeating with a paid `assigned`/`arriving` ride, nothing ever resolves it: the matcher ignores
the driver, the ride stays active, and the one-active-ride guard (`rides.ts:50-56`) blocks the
rider from booking anything else. Their only exit is rider-cancel → which (H4) eats their money.
**Fix (cheap):** in the sweep, detect paid active rides whose driver's `lastSeenAt` is stale
beyond N minutes → auto re-match (same machinery as driver-cancel) or flag stranded+refund.

### H6. `POST /buses/location` lets ANY authenticated user become a "bus" — and un-register a keke
`buses.ts:91-113` — no role/whitelist gate (unlike keke `register`). Any student can post a bus
position (corrupting the tracker + firing proximity pings to real subscribers), and calling it as
a registered keke driver flips that driver doc's `vehicleType` to `"bus"` (merge-write), silently
removing the keke from the matcher.
**Fix:** gate bus drivers like keke drivers (whitelist or an explicit register step), or at least
refuse to overwrite an existing `vehicleType:"keke"` doc.

### M7. `/rides/:id/complete` is not transactional → double-credit
`rides.ts:363-389` — status check, update, and earnings credit are separate awaits. Two concurrent
completes (double-tap, retry) can both pass the `started` check → driver credited twice
(`earnings` doc + `earningsKobo` increment both duplicated).
**Fix:** wrap read-check-update in a transaction (like booking already does), or make the earnings
doc id deterministic (`earnings/{rideId}`) so the second write collides.

### M8. 6-digit PIN + no rate limit on complete = brute-forceable
`/rides/:id/complete` has no `config.rateLimit` (only `/rides`, `/sos`, `/incidents/report` do).
The rider is authenticated and knows their rideId, so a scripted rider can brute the 1e6 PIN space
and self-complete without the driver present (undermines the presence proof, not the money).
**Fix:** add the same per-user rate limit to `complete` (e.g. 10/min) — one line.

### M9. LLM triage output is trusted verbatim → a malformed severity breaks the alert
`ai-triage.ts:50-57` — `severity` is constrained only by a *description* string, not an enum, and
the parsed JSON is cast unchecked. If the model returns `"CRITICAL"`/`"urgent"`,
`SEVERITY_EMOJI[triage.severity]` is `undefined` and the Telegram title renders "undefined SOS";
downstream consumers of `Incident.severity` get an out-of-enum value.
**Fix:** use a schema `enum` for severity + Zod-parse the LLM JSON; fall back to `safeTriage`'s
default on parse failure. Also: confirm the default model id (`gemini-3.5-flash`) against Google's
current model list — verify, don't trust the env default.

### M10. Payments `init` idempotency has a race
`payments.ts:57-67` — the existing-payment check and the create are not atomic; two concurrent
inits can both see "none" and mint two Monnify (→ Partna) transactions. Mostly a double-charge-UX
risk since reconcile checks amount per payment doc.
**Fix:** deterministic payment doc id per ride (`payments/{rideId}`) or a transaction.

### L11. Assorted (fine at campus scale — list for completeness)
- **Sweep only runs on `POST /rides`** — an expired hold lingers visibly (driver's
  `/drivers/me/rides`, rider's Firestore doc) until the *next booking anywhere*. Consider also
  sweeping in `/drivers/me/rides` and `/payments/init`.
- **`/payments/verify` lets any authenticated user probe any reference** (status/amount leak; no
  ownership check). Harmless-ish; tighten by joining payment→ride→riderId.
- **Rate-limit key is the raw Authorization header** (`server.ts:43`) — hourly token refresh
  resets the bucket; fine for the demo.
- **Surge `availableKekes()` is campus-global** while `pendingRequests()` is per-zone — surge in
  one zone is damped by idle kekes parked across campus. Plan §8 arguably intends per-zone supply;
  acceptable at one-campus scale, worth a comment.
- **`GET /drivers/me/rides` never returns `etaMin`** though API.md lists it as optional — either
  compute it or drop it from the doc.
- **Telegram webhook deletes the nonce before writing `chatId`** — a crash in between burns the
  link (user just taps Connect again; fine).
- **`server.ts` health route bypasses the envelope helper** (hand-rolls `{ok,data}`) — cosmetic.
- **Composite indexes:** `firestore.indexes.json` covers only the surge query. The one-active-ride
  and driver-active-rides queries (`riderId ==` / `driverId ==` + `status in`) run on merged
  single-field indexes, so they're fine — but keep the file authoritative if queries grow.

---

## 4. Plan / docs audit — findings

1. **`docs/todo.md` (Solana roadmap) is built on a dead asset.** Phase S1 = "cNGN ride payment";
   Partna doesn't support cNGN (§1). The entire Solana track survives by substituting **USDC on
   Solana devnet→mainnet** — the treasury/insurance story is unchanged and actually *stronger*
   (USDC is the canonical stablecoin; Partna natively delivers it). todo.md needs a rewrite, not a
   patch.
2. **PROJECT_PLAN §4/§9/§16-17 lock Monnify as primary** and describe disbursement as "verify
   Monnify's disbursement API before building" — superseded by §5 below. §9's "payment gates
   completion", TTL, ledger, and QR logic all survive unchanged; only the *edge* (who collects the
   naira and where it settles) changes.
3. **Docs drift, minor but real:**
   - `FLOW_GUIDE.md` and `FLOW_GUIDE.txt` are the same 900-line guide in two formats — they *will*
     diverge. Keep `.md`, delete `.txt` (or make it a generated copy).
   - `FRONTEND_SCREENS.md` still shows an `arrived` status (`assigned → arriving → arrived →
     started`) that the backend never had.
   - `AGENTS.md` §8 env list is missing `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`,
     `LLM_MODEL`, the lifecycle tunables, and (soon) the Partna vars; its §5 service table still
     says "LLM (eg Claude)" while the code is Gemini, and lists Monnify as HIGH-risk-verify.
   - `PROJECT_PLAN` §14's `Ride.status` line and API.md are consistent — good — but both must gain
     the Partna payment fields after migration.
4. **The 3-minute payment window (§20.1) is calibrated to card checkout, not bank transfer.**
   A Partna onramp settles on a *customer-initiated bank transfer* — commonly 1–5+ min end-to-end.
   Keep the TTL concept, raise the default for the Partna path (recommend `PAYMENT_WINDOW_MS` →
   10 min) — it's already env-tunable, no code change.
5. **Earnings split is currently 100% of seat fare to the driver** (+50% of surge fee,
   `rides.ts:376`). The treasury story on stage says "~5% platform/welfare cut". That 5% doesn't
   exist in code — decide (§5 Phase 2 makes it a one-line constant) and, per todo.md's open
   question, decide *whose* 5% it is.
6. **Demo honesty list (FLOW_GUIDE §13) must be regenerated** after migration: cNGN note goes
   away, "Monnify disbursement deferred" becomes "Partna offramp withdrawal deferred/mocked",
   webhook setup notes change (RSA public key, staging mock endpoint).

---

## 5. The new payment flow — **Partna-only plan (v7)**

> Replaces Monnify + cNGN wholesale. Architecture = **Collect 100% → Ledger split → Batch
> withdraw** (the "true aggregator" model — Uber/Bolt economics, verified against Partna's real
> API). The rider-facing contract keeps the same shape (`checkoutUrl`-style init → verify →
> webhook), so frontend changes are minimal.

### 5.0 Principles (unchanged from v6)
- Money stays **integer kobo** internally; convert at the Partna edge only (naira decimals out,
  kobo in). USDC base units (6 dp) only ever matter at the future on-chain withdrawal edge.
- Payment still **gates** driver advance + completion (402), TTL still sweeps unpaid holds.
- The earnings **ledger stays the payout source of truth**; no per-ride disbursement, ever
  (micro-transaction trap, §2).

### Phase P1 — Collection via Partna onramp (replaces Monnify; BUILD THIS)

**Flow:** rider books → `POST /payments/init` → backend creates a Partna onramp →
rider pays NGN by bank transfer (widget or virtual-account details) → Partna converts →
**100% USDC lands in the platform treasury wallet** → `Onramp` webhook → ride flips `PAID`.

Backend work (`apps/api`):
1. **`lib/partna.ts`** (replaces `lib/monnify.ts`):
   - `getRate(from, to)` → `GET /v4/rate` (capture `rateKey`).
   - `createOnramp({ amountNaira, reference })` → `POST /v4/ramp` with
     `{ type:"fiatToCrypto", fromCurrency:"NGN", fromNetwork:"naira", toCurrency:"USDC",
     toNetwork:"solana", fromAmount, cryptoAddress: TREASURY, rateKey, rampReference }` →
     returns the virtual account (`accountName/accountNumber/bankName`) + amounts.
   - `getRampByReference(ref)` → `GET /v4/ramp?rampReference=` (verify fallback).
   - `verifyPartnaWebhook(payload)` → **RSA-PSS/SHA-256 `crypto.verify` of the JSON-encoded
     `data` against `PARTNA_WEBHOOK_PUBLIC_KEY`** (env-specific key). Note: this verifies the
     *parsed* `data` field re-encoded — different from Monnify's raw-body HMAC; the rawBody hook
     in `server.ts` can stay but isn't the mechanism here.
   - Widget-URL builder (option A): `https://<pay-host>/v4/pay/onramp?amount=&from_currency=NGN&
     to_currency=USDC&to_network=solana&address=<TREASURY>&merchant=<PARTNA_API_USER>&reference=<ref>`.
2. **`POST /payments/init`** — same route, same idempotency (+ fix M10), same response *shape*:
   - Option A (recommended, minimal frontend delta): return the **widget URL as `checkoutUrl`** +
     `reference`.
   - Option B (nicer UX later): return `{ bankTransfer: { accountNumber, bankName, accountName },
     amount, reference }` and let the app render "transfer ₦X to this account" natively.
3. **`POST /payments/webhook`** — verify RSA signature; handle `event: "Onramp"`; idempotent by
   `rampReference`; reuse `reconcile()` **with the C3 fix** (check ride still active, else
   `refundPending`). Always 200 fast.
4. **`POST /payments/verify`** — same contract (`{ status, amount, paid }`), now backed by
   `getRampByReference` (`status === "completed"` + amount covers fare → PAID).
5. **Schema/type sweep:** `payMethod` → `"transfer"` only (or keep the string but collapse the
   enum); delete the cngn branch everywhere (closes **C1**); `Payment.method` follows.
6. **Env:** remove `MONNIFY_*`; add
   `PARTNA_API_KEY, PARTNA_API_USER, PARTNA_BASE_URL (staging default), PARTNA_PAY_URL,
   PARTNA_WEBHOOK_PUBLIC_KEY, TREASURY_SOLANA_ADDRESS`; bump `PAYMENT_WINDOW_MS` default → 10 min
   for the transfer flow (§4.4).
7. **Bundle the §3 fixes that touch payment paths** (C2, C3, H4, M10) into this phase — they're
   all in the two files being rewritten anyway.

**Demo/mock path (the hackathon build):** run against **staging**; after `init`, fire
`POST /v4/mock/fiat-deposit { amount, currency:"NGN" }` (a "Simulate payment" dev button or
script) → Partna sends the real `Onramp` webhook (tunneled via ngrok) → ride flips PAID live on
stage. That is a *real* end-to-end integration with zero real naira — say exactly that to judges.

### Phase P2 — The 95/5 ledger split (tiny; makes the treasury story true)
- `PLATFORM_FEE_BPS` env (default `500` = 5%). On completion: driver credit =
  `seatFare − fee` (or fare + fee on top — **open product decision**, todo.md already asks) + 50%
  surge share (unchanged). Record the platform cut per ride (`treasuryContributions`-style doc) so
  the "on-chain transparent welfare fund" pitch has a per-ride paper trail.
- Everything else (ledger, `GET /drivers/me/earnings`) already exists — this is ~15 lines.

### Phase P3 — Driver withdrawal (documented + mocked for the demo; real in prod)
`POST /drivers/me/withdraw { amountKobo, method: "bank" | "wallet" }`, batched by design (driver
pulls at end of shift/week — never per ride):
- **Path A (bank):** resolve account (`POST /v4/kyc/resolve-account`, banks from `GET /v4/bank`) →
  rate → `POST /v4/ramp { type:"cryptoToFiat", fromCurrency:"USDC", fromNetwork:"solana",
  toCurrency:"NGN", toNetwork:"naira", accountName/accountNumber/bankCode, rampReference }` →
  send USDC from treasury to the ramp deposit address → `Offramp` webhook → debit ledger.
  Driver absorbs the offramp fee/spread (standard platform behavior — say so).
- **Path B (wallet):** direct on-chain USDC transfer treasury → driver's wallet
  (`@solana/web3.js` + `@solana/spl-token`; deps land only in this phase). Debit ledger on
  confirmed signature.
- Ledger debit must be transactional against `earningsKobo` (no overdraw; one pending withdrawal
  per driver).

### Phase P4 — Prod-only pitch lines (build nothing)
- **Kamino:** "idle treasury float supplied to Kamino Lend for 5–9% APY until batch withdrawals —
  V2, after the float is meaningful." One sentence, zero code.
- **KYC:** riders/drivers onboard once (BVN/phone) via Partna accounts — staging uses test data.
- **FX:** ledger is naira-denominated, treasury is USDC — platform carries (and typically
  benefits from) the spread; a hedging policy is a prod concern.

### What dies
`lib/monnify.ts`, all `MONNIFY_*` env, every cNGN mention (PROJECT_PLAN §4/§9/§16, todo.md S1,
FLOW_GUIDE §13, BACKEND_INTEGRATION types, `payMethod` enum), and todo.md's cNGN faucet/mint
open questions.

---

## 6. Update checklist (after this report is approved)

**Code (`apps/api`):**
- [ ] P1: `lib/partna.ts` + rewrite `routes/payments.ts` + schema/type sweep (kills C1) + env
- [ ] Fixes: C2 (reuse merge-preserve), C3 (reconcile ride-status check), H4 (rider-cancel refund
      flag), H5 (stale-driver rescue in sweep), H6 (gate `/buses/location`), M7 (transactional
      complete / deterministic earning id), M8 (rate-limit complete), M9 (LLM enum + Zod), M10
      (deterministic payment id)
- [ ] P2: `PLATFORM_FEE_BPS` split + per-ride platform-cut record
- [ ] P3: withdraw endpoint (mock/stub for demo)

**Docs:**
- [ ] `PROJECT_PLAN.md` — §4 stack row (Monnify→Partna, cNGN→USDC-on-Solana), §9 rewritten to the
      Collect→Ledger→Batch model, §16 phases, §17 locked decisions, new §21 (this migration)
- [ ] `API.md` — payments section (init response option, webhook auth = Partna RSA, verify), new
      withdraw endpoint when built
- [ ] `BACKEND_INTEGRATION.md` — payment step for the app (widget URL or transfer details), env
- [ ] `FLOW_GUIDE.md` — §1 env, §7 payment endpoints, §13 honesty list; **delete FLOW_GUIDE.txt**
- [ ] `todo.md` — rewrite S1 as "USDC-on-Solana via Partna" (S2/S3 story survives verbatim)
- [ ] `AGENTS.md` — §5 verify-table row (Monnify→Partna, verified 2026-07-08), §8 env names
- [ ] `.env.example` — swap Monnify block for Partna block
- [ ] `FRONTEND_SCREENS.md` — drop the phantom `arrived` status

---

*End of audit. §1–2 verified against live Partna docs on 2026-07-08; §3 line refs against commit `d84e51b`.*
