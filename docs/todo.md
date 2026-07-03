# todo.md — Solana Roadmap (to win the Solana bounty) 🏆◎

> **Status:** planning only — nothing here is built yet. This is the sequenced plan
> for the Solana side of FUTO-Ride. The Alerta/AI safety layer (the main prizes) is
> already built and tested; this is the **additional** Solana track.
>
> **Shift from the original plan:** PROJECT_PLAN §5/§9/§16 treated Solana as a
> "light touch — cut freely." We are now aiming to **actually win a Solana bounty**,
> so cNGN is no longer decorative — it becomes a real on-chain payment path plus a
> genuinely novel treasury/insurance mechanism. Naira (Monnify) stays the primary,
> legal-tender path; cNGN is opt-in (crypto isn't legal tender in NG).

---

## Where we are now (verified in code)

- `payMethod: "naira" | "cngn"` is a **valid enum** and is **stored** on the ride,
  but **nothing branches on `cngn`** — a cNGN ride still gets a naira fare and would
  still go through Monnify. It's a placeholder seam.
- `User.privyWallet?` field exists as a placeholder. No wallet logic.
- **Zero** Solana / Privy / web3 code or dependencies in `apps/api`.
- Monnify naira payments: **built + sandbox-tested** (init → checkout → verify).

So the Solana work is a green field — we build onto clean seams, not fight old code.

---

## The pitch (why this wins a Solana bounty)

A campus keke app where:
1. Students can **pay their fare in cNGN** on Solana devnet (real on-chain transfer).
2. Every ride auto-contributes **~5% into an on-chain driver-welfare treasury**.
3. When a driver has a mishap (tyre bursts, repair needed) they submit a **photo
   claim**; **AI verifies** it (reuses our triage stack) and the treasury **pays out
   cNGN** for the repair — **decentralised mutual insurance for informal drivers.**

The story is the win: real utility for real (unbanked/informal) drivers, on-chain
transparency of the welfare fund, and it **stacks on our AI prize** (AI claim
verification). That's substance, not a "we sent one token" checkbox.

---

## PHASE S1 — cNGN ride payment (devnet) ← BUILD THIS FIRST

> The foundation. The 5% treasury split only makes sense once cNGN actually flows.

**Goal:** a rider with `payMethod: "cngn"` pays the fare in cNGN on Solana devnet.

- [ ] **Confirm the pieces (verify before coding):**
  - [ ] cNGN devnet SPL token **mint address** + decimals (get from cNGN docs/faucet).
  - [ ] Get devnet SOL (faucet) + test cNGN for the demo wallets.
  - [ ] Privy: how the **mobile** app creates/exposes a wallet + signs (frontend dev's
        domain — we just need the wallet pubkey and a way to receive the signed tx or
        confirm the transfer).
- [ ] **Decide the flow (one of):**
  - [ ] **App-signed transfer (recommended for devnet):** the mobile app builds+signs
        the cNGN transfer (rider wallet → platform wallet) via Privy, submits it, and
        sends the **tx signature** to our backend to verify on-chain. Backend never
        holds the rider's key. Cleanest, most "real".
  - [ ] Backend-orchestrated: backend builds an unsigned tx, app signs, backend
        submits. More backend control, more moving parts.
- [ ] **Backend work (`apps/api`):**
  - [ ] Add deps: `@solana/web3.js`, `@solana/spl-token` (verify latest versions).
  - [ ] New `lib/solana.ts`: connection (devnet RPC), `verifyCngnTransfer(sig, expectedAmount, to)`
        — confirms a finalized cNGN transfer of the right amount to the platform ATA.
  - [ ] New route `POST /payments/cngn/verify { rideId, signature }` — verifies the
        on-chain transfer, marks a `Payment { method: "cngn" }` as paid. (Mirror of
        the Monnify verify, but reads the chain instead of Monnify.)
  - [ ] Branch on `payMethod` in the payment flow: `naira` → Monnify (existing);
        `cngn` → the on-chain path. Fare stays **kobo internally**; convert to cNGN
        base units only at the chain edge (like we do naira at the Monnify edge).
  - [ ] Store `privyWallet` (rider pubkey) on the user doc when they connect a wallet.
  - [ ] Env: `SOLANA_RPC_URL`, `CNGN_MINT`, `PLATFORM_SOLANA_WALLET` (pubkey), and a
        `PLATFORM_SOLANA_SECRET` only if the backend must send (treasury phase).
- [ ] **Docs:** update API.md (new endpoint), BACKEND_INTEGRATION.md (how the app
      pays in cNGN + sends the signature), FLOW_GUIDE.txt, PROJECT_PLAN §9.
- [ ] **Test on devnet:** real transfer, backend verifies signature, payment marked paid.

**Definition of done (S1):** a rider pays a real fare in cNGN on devnet and the
backend confirms it from the chain.

---

## PHASE S2 — Driver-welfare treasury (5% split)

> Depends on S1 (cNGN must flow first). Custodial-wallet version — NOT a smart
> contract yet (see S4). Matches PROJECT_PLAN's "no escrow program" for now.

- [ ] **Treasury = a platform-controlled Solana wallet** (its own keypair/ATA for cNGN).
- [ ] On a **completed** cNGN ride: compute `treasuryCut = round(fare × 0.05)` and
      move that cNGN from the platform/collections wallet into the **treasury wallet**
      (a second on-chain transfer). Record a `treasuryContributions` doc
      `{ rideId, driverId, amount, sig, createdAt }`.
  - [ ] Decide whose 5% it is: the plan's fee model already splits fees; here the 5%
        is a **driver-welfare levy** — document clearly whether it comes off the
        driver's earnings or the platform's cut (product decision).
- [ ] `GET /treasury/balance` → live on-chain cNGN balance of the treasury wallet
      (transparency — show it in the app/demo).
- [ ] **Naira parity (optional):** if a ride was paid in **naira**, either skip the
      on-chain levy or mirror it as a ledger entry funded later — keep it simple; the
      Solana story is the cNGN path.
- [ ] **Docs + devnet test:** contribution transfer fires on completion, balance grows.

**Definition of done (S2):** completing cNGN rides visibly grows an on-chain treasury.

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
- [ ] On approval: **treasury wallet → driver wallet** cNGN transfer; record
      `claims { id, driverId, amount, status, aiReason, sig, createdAt }`.
- [ ] Human-in-the-loop option: high-value/low-confidence claims route to an admin
      (Telegram, like incidents) before payout.
- [ ] **Docs + devnet test:** submit a claim → AI approves → driver receives cNGN.

**Definition of done (S3):** a driver submits a tyre-burst photo and receives a cNGN
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

- [ ] **Whose 5%?** driver's earnings vs platform cut vs a small rider surcharge.
- [ ] **cNGN devnet availability:** confirm mint + faucet actually work on devnet
      (if cNGN isn't on devnet, fall back to a stand-in SPL token for the demo and
      say so honestly).
- [ ] **Wallet custody:** rider/driver via Privy (non-custodial) — confirm the mobile
      integration path with the frontend dev.
- [ ] **Payout controls:** per-claim cap, per-driver rate limit, fraud rules.
- [ ] **Naira rides + treasury:** contribute, skip, or ledger-and-settle-later?

---

## Guardrails (keep the main prize safe)

- Alerta/AI safety layer is the headline and is **done** — Solana work must **not**
  regress it. Re-run the existing test suite after Solana changes.
- Naira (Monnify) stays the **primary** path; cNGN is **opt-in** (legal-tender reality).
- Everything stays on **devnet**. No mainnet, no real funds.
- Keep money **kobo internally**; convert to cNGN base units only at the chain edge
  (same discipline as the Monnify naira edge).
