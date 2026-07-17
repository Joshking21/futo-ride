# todo.md — Solana Roadmap (to win the Solana bounty) 🏆◎

> **Status:** the treasury/insurance track. **Big update (v7):** the Solana angle is no
> longer a bolt-on — the **main payment flow now settles USDC on Solana via Partna**
> (PROJECT_PLAN §21). Every fare a rider pays becomes USDC in the platform treasury on
> Solana. So the "on-chain treasury" this roadmap is built around **already exists as a
> side effect of collecting fares**. What's left is the welfare-levy + AI-claims story.
>
> **Shift from the original plan:** cNGN is **DROPPED** — Partna doesn't support it, and
> it was never legal tender anyway. The settlement asset is **USDC on Solana**. The rider
> always pays **naira** (legal tender); the USDC leg is invisible to them (a treasury/
> liquidity detail, exactly like Uber's float). This is *stronger* than the old cNGN plan:
> USDC is the canonical stablecoin and Partna delivers it natively.

---

## Where we are now (verified in code, v7)

- `payMethod` is now **`"naira"` only** (cNGN enum removed — it was a free-ride hole, C1).
- **Payments run on Partna** (`lib/partna.ts` + `routes/payments.ts`): NGN onramp →
  **USDC settled into `TREASURY_SOLANA_ADDRESS`** → RSA-verified webhook marks the ride PAID.
  Built; demo via staging `POST /payments/mock-deposit`.
- **The 5% welfare cut is LIVE**: on completion the platform's cut is recorded per ride in
  `treasuryContributions` (driver keeps 95%). The "on-chain welfare fund" story has a paper
  trail already (§21/P2).
- **Withdrawal ledger is built**: `POST /drivers/me/withdraw` debits earnings
  transactionally; the actual **offramp / on-chain USDC transfer leg is the deferred step**.
- `User.privyWallet?` exists as a placeholder. **Zero** direct `@solana/web3.js` /
  `@solana/spl-token` code yet — the on-chain *transfer* legs (S1 wallet payout, S2 treasury
  sweep, S3 claim payout) are what this roadmap still adds.

---

## ⚠️ VERIFY ON STAGING — two-tier payment unlock (added: reduce rider wait)

> **What changed:** `reconcile()` now unlocks the ride on **fiat received** (naira in), not on
> full **USDC settlement** (`completed`) — so the rider isn't blocked on the on-chain conversion.
> Judges flagged the wait; this fixes it. Fiat-received = `isFiatReceived()` in `lib/partna.ts`;
> treasury settlement stays on `completed`. Every assumption below is marked `TODO(partna-verify)`
> in code. **Confirm these before trusting the early unlock in production.**

Run: book a ride → `POST /payments/init` → `POST /payments/mock-deposit` → watch the API logs
(`"partna webhook received"` line logs `event / status / confirmed`). Then confirm:

- [ ] **Which event fires first?** Does a **`Deposit`** event arrive (fiat received) *before* the
      **`Onramp`** event (USDC settled)? Note the order and timing gap.
- [ ] **Does the `Deposit` payload carry `data.rampReference`?** If it uses a different key, the
      webhook won't correlate it to our ride — map the correct field in `/payments/webhook`.
- [ ] **What are `status` + `confirmed` at fiat-receipt?** If `status: "processing"` (or
      `"received"`) reliably means naira-in, add it to `isFiatReceived()` to unlock a touch earlier.
- [ ] **Is a received deposit ever reversible?** Ask Partna: *"at which event is the customer's
      fiat non-reversible?"* If it can reverse, keep unlock as-is and NEVER move the treasury
      credit off `completed` (an early ride unlock is then the only exposure — money never lands
      = no over-credit).
- [ ] **Amount check holds** at the fiat tier: received naira ≥ fare (not just requested amount).
- [ ] **Re-run after `completed`:** the second webhook must NOT flag an already-PAID/completed
      ride as `refundPending` (guarded — confirm in logs).

So the treasury already fills from real fares; the remaining Solana work is the **on-chain
transfer legs** (Privy wallet payout, and the AI-verified insurance claims).

---

## The pitch (why this wins a Solana bounty)

A campus keke app where:
1. Every fare a student pays (in naira) is **settled as USDC on Solana** in the platform
   treasury — via Partna's onramp. Real stablecoin flow, on real rails. **(Built.)**
2. Every ride auto-contributes **~5% into a driver-welfare treasury** on-chain. **(Recorded
   per ride today; the on-chain sweep is S2.)**
3. When a driver has a mishap (tyre bursts, repair needed) they submit a **photo claim**;
   **AI verifies** it (reuses our triage stack) and the treasury **pays out USDC** for the
   repair — **decentralised mutual insurance for informal drivers.** **(S3.)**

The story is the win: real utility for real (unbanked/informal) drivers, on-chain
transparency of the welfare fund, and it **stacks on our AI prize** (AI claim
verification). That's substance, not a "we sent one token" checkbox — and the collection
half is already live via Partna.

---

## PHASE S1 — USDC settlement is DONE (via Partna) ✅

> The old S1 was "wire cNGN payment." That's superseded: the **main payment flow already
> settles USDC on Solana** (PROJECT_PLAN §21). No separate cNGN path to build.

- [x] Rider pays naira → Partna onramp → **USDC delivered to `TREASURY_SOLANA_ADDRESS`**.
- [x] Backend confirms via RSA-verified webhook / `getRampByReference` → ride PAID.
- [x] Fare stays **kobo internally**; naira only at the Partna edge; USDC base units only
      ever matter at the future on-chain *transfer* edge (S2/S3).
- [ ] **Remaining (thin):** capture each rider's/driver's `privyWallet` pubkey on their doc
      when they connect a wallet (needed for on-chain payout in S2/S3 — frontend supplies it).

**Definition of done (S1):** ✅ a real fare settles as USDC in the treasury on-chain and the
backend confirms it. (Demo it on staging with `POST /payments/mock-deposit`.)

---

## PHASE S2 — Driver-welfare treasury (5% split)

> Depends on S1 (USDC must flow first). Custodial-wallet version — NOT a smart
> contract yet (see S4). Matches PROJECT_PLAN's "no escrow program" for now.

- [ ] **Treasury = a platform-controlled Solana wallet** (its own keypair/ATA for USDC).
- [ ] On a **completed** USDC ride: compute `treasuryCut = round(fare × 0.05)` and
      move that USDC from the platform/collections wallet into the **treasury wallet**
      (a second on-chain transfer). Record a `treasuryContributions` doc
      `{ rideId, driverId, amount, sig, createdAt }`.
  - [ ] Decide whose 5% it is: the plan's fee model already splits fees; here the 5%
        is a **driver-welfare levy** — document clearly whether it comes off the
        driver's earnings or the platform's cut (product decision).
- [ ] `GET /treasury/balance` → live on-chain USDC balance of the treasury wallet
      (transparency — show it in the app/demo).
- [ ] **Naira parity (optional):** if a ride was paid in **naira**, either skip the
      on-chain levy or mirror it as a ledger entry funded later — keep it simple; the
      Solana story is the USDC path.
- [ ] **Docs + devnet test:** contribution transfer fires on completion, balance grows.

**Definition of done (S2):** completing USDC rides visibly grows an on-chain treasury.

### S2b — Kamino float yield (PROD / V2 pitch — DO NOT BUILD for the demo)
> The capital-efficiency story that turns the payout *liability* into a yield asset. Keep it in
> the pitch, not the codebase (§21.7 / PROJECT_PLAN §21.7).

- Native USDC sitting in the treasury earns **0%** — it's just cash in a safe.
- The float (drivers' unpaid earnings held between collection and their weekly withdrawal) is
  real idle liquidity — exactly what Uber/Bolt sweep into interest-bearing accounts.
- **V2:** the treasury PDA programmatically supplies idle USDC to **Kamino Lend** (Solana's
  largest stablecoin lending venue, ~5–9% supply APY), and pulls the principal back when a
  driver withdraws — the treasury keeps the accrued interest **plus** the 5% welfare cut.
- **Stage line (verbatim-ready):** *"For the MVP the float sits in the treasury PDA; for V2 it's
  supplied to Kamino Lend for a 5–9% baseline APY, turning our payout liability into a
  yield-generating asset until drivers batch-withdraw."*
- **Not for the demo** — it's real DeFi integration + risk (Kamino market, liquidation, on-chain
  keys) with zero added demo value. Ship S1–S3 first; Kamino is the "what's next" slide.

---

## PHASE S3 — AI-verified repair claims (payout) 🤖 stacks on the AI prize

- [ ] Driver submits a claim: `POST /treasury/claims { type, description, photoUrl, amount }`
      (photo stored via the app; backend gets a URL).
- [ ] **AI verification (reuse `lib/ai-triage.ts` pattern):** LLM assesses the photo +
      description → `{ approved, confidence, reason, suggestedAmount }`. E.g. "tyre
      clearly burst, consistent with claim → approve up to ₦X".
  - [ ] Guardrails: cap payout per claim; cap per driver per period; flag likely fraud
        (same photo reused, amount too high) — mirrors the false-alarm filtering we
        already do for SOS.
- [ ] On approval: **treasury wallet → driver wallet** USDC transfer; record
      `claims { id, driverId, amount, status, aiReason, sig, createdAt }`.
- [ ] Human-in-the-loop option: high-value/low-confidence claims route to an admin
      (Telegram, like incidents) before payout.
- [ ] **Docs + devnet test:** submit a claim → AI approves → driver receives USDC.

**Definition of done (S3):** a driver submits a tyre-burst photo and receives a USDC
payout from the treasury after AI approval — end-to-end, on devnet.

---

## PHASE S4 — On-chain program (Anchor) — LATER / STRETCH ⚠️

> The "proper", trustless version. **Not for now** — captured so the roadmap shows
> intent. This is the single biggest build in the project (Rust + Anchor + deploy +
> test) and the highest demo risk. Ship S1–S3 (custodial) first; describe S4 as the
> decentralisation roadmap on stage.

- [ ] Anchor program holding the treasury PDA: enforces the 5% contribution rule and
      gates payouts (rules / multisig / DAO-style approval) trustlessly.
- [ ] Claims approved on-chain (oracle/attestation from our AI as a signer, or
      committee vote) rather than a backend-controlled wallet.
- [ ] Migrate S2/S3 custodial flows to call the program.

**Why deferred:** contradicts the current "escrow cut" scope; only worth it if S1–S3
are solid and there's real time left. The custodial version already demonstrates the
full user story on-chain.

---

## Open decisions (resolve before/while building)

- [x] **Whose 5%?** RESOLVED (v7): a platform welfare cut **off the top of the seat fare**
      (`PLATFORM_FEE_BPS`, default 5%); driver keeps 95%. Revisit if it should be a rider
      surcharge instead.
- [ ] **Which Solana cluster for S2/S3 transfers?** Partna settles USDC to our treasury
      address (its network); the S2 sweep + S3 payouts need the treasury keypair on the
      same cluster. Confirm with Partna which network their USDC lands on (`solana`).
- [ ] **Wallet custody:** rider/driver via Privy (non-custodial) — confirm the mobile
      integration path with the frontend dev; capture `privyWallet` on connect (S1 remaining).
- [ ] **Payout controls:** per-claim cap, per-driver rate limit, fraud rules.
- [ ] **Treasury source of the 5%:** S1 already lands 100% of the fare as USDC + records the
      5% cut in `treasuryContributions`. S2 is just the on-chain *sweep* into a separate
      welfare wallet (or leave it logical and pay claims from the main treasury).

---

## Guardrails (keep the main prize safe)

- Alerta/AI safety layer is the headline and is **done** — Solana work must **not**
  regress it. Re-run the existing test suite (`src/scripts/e2e-test.ts`) after changes.
- The rider always pays **naira** (legal tender); USDC settlement is invisible plumbing.
- S2/S3 on-chain transfers use **real USDC on Solana** (Partna settles there) — treat the
  treasury keypair as a live secret; test with small amounts first.
- Keep money **kobo internally**; convert to naira at the Partna edge and to USDC base
  units only at the on-chain transfer edge.
