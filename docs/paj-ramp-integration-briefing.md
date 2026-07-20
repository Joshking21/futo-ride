# PAJ Ramp SDK — Integration Briefing

Compiled by direct inspection of the source (not from memory/training data) on 2026-07-19.
Every claim below traces to a specific file or command output. URLs are included throughout —
**verify against them before implementing**, and if anything here conflicts with what you find
at those URLs, trust the live source over this document; repos change.

## Sources consulted

| What | URL |
|---|---|
| Main repo | https://github.com/paj-cash/paj_ramp |
| Examples folder | https://github.com/paj-cash/paj_ramp/tree/main/examples |
| HTTP API reference (authoritative, more complete than root README) | https://github.com/paj-cash/paj_ramp/blob/main/lib/API_REFERENCE.md |
| SDK entry point / barrel export | https://github.com/paj-cash/paj_ramp/blob/main/sdk.ts |
| Enums | https://github.com/paj-cash/paj_ramp/blob/main/utils/enums.ts |
| Onramp socket client | https://github.com/paj-cash/paj_ramp/blob/main/utils/onramp-socket.ts |
| Offramp order creation | https://github.com/paj-cash/paj_ramp/blob/main/lib/off_ramp/createOrder.ts |
| Onramp order creation | https://github.com/paj-cash/paj_ramp/blob/main/lib/on_ramp/createOrder.ts |
| Session auth | https://github.com/paj-cash/paj_ramp/blob/main/lib/utility/session/ |
| Publish CI workflow | https://github.com/paj-cash/paj_ramp/blob/main/.github/workflows/publish.yml |
| Unrelated "Dummy_server" repo (see §9) | https://github.com/paj-cash/Dummy_server |
| paj-cash GitHub org (all repos) | https://github.com/paj-cash |
| Published package | https://www.npmjs.com/package/paj_ramp |
| Product marketing site | https://paj.cash |
| Developer portal (client-rendered, limited static content) | https://developer.paj.cash |

Package: `npm install paj_ramp`. Language: TypeScript. Chains supported: Solana and Monad only.
Fiat currencies: NGN, GHS, TZS, KES, ZAR, USD.

---

## 1. Auth model — two distinct credentials

- **`apiKey`** — your PAJ business key. Used **only** for `initiate`/`verify`. Sent as header `x-api-key`.
- **`token`** (referred to conversationally as the "session token") — returned by `verify()`. Sent as
  `Authorization: Bearer <token>` on every other authenticated call. Has an `expiresAt`; re-verify when expired.

### `initiate(recipient, apiKey)`
`POST /pub/initiate`. Picks email vs. phone via `isNaN(+recipient)` — anything that doesn't coerce to a
number is sent as `{ email: recipient }`; otherwise `{ phone: recipient }`. Headers: `x-api-key`,
`Content-Type: application/json`. Response: `{ email? , phone? }`. Triggers an OTP to the recipient.

### `verify(recipient, otp, device, apiKey)`
`POST /pub/verify`. Body adds `otp` and `device` to the same email/phone object.
`device: DeviceSignature = { uuid, device, os?, browser?, ip? }` — only `uuid` and `device` are required.
Response:
```json
{ "recipient": "user@example.com", "isActive": "true", "expiresAt": "2026-04-20T10:30:00.000Z", "token": "eyJ..." }
```
**The field is literally named `token`, not `sessionToken`** — `sessionToken` is just what every other
function's parameter is called when you pass this value in.

---

## 2. Environment setup

```ts
import { initializeSDK, Environment } from 'paj_ramp';
initializeSDK(Environment.Staging);   // or Environment.Production / Environment.Local
```

Verified in `sdk.ts` and `utils/enums.ts`:
- `Environment.Staging` → `https://api-staging.paj.cash`
- `Environment.Production` → `https://api.paj.cash`
- `Environment.Local` → `http://localhost:3000` (nothing is shipped to run there — see §9)
- **The default `baseURL`, before `initializeSDK` is ever called, is already hardcoded to staging.** So staging
  is what you get by doing nothing — but call `initializeSDK` explicitly anyway, always, so you're never
  relying on an implicit default in production.
- **Passing anything other than these three exact enum values is a silent no-op** — no error, no warning,
  base URL just stays whatever it already was. Confirmed in `__tests__/sdk.test.ts`.
- **This env switch does NOT affect the onramp socket** (see §6) — that URL is separately hardcoded to staging
  regardless of what you pass here.
- Not confirmed anywhere in code or docs: whether the same `apiKey` works on both Staging and Production, or
  whether staging requires a separate key from the PAJ dashboard. If auth fails after switching environments,
  check this before assuming it's a bug in your request.

---

## 3. Full endpoint reference

| Function | Method & path | Auth |
|---|---|---|
| `initiate` | `POST /pub/initiate` | `x-api-key` |
| `verify` | `POST /pub/verify` | `x-api-key` |
| `getAllRate` | `GET /pub/rate` | none |
| `getRateByAmount` | `GET /pub/rate/{amount}` | none |
| `getRateByType` | `GET /pub/rate/{type}` (`onRamp`\|`offRamp`) | none |
| `getTokenValue` (= `getOnrampValue`) | `GET /pub/rates/onramp-value` | Bearer |
| `getFiatValue` (= `getOfframpValue`) | `GET /pub/rates/offramp-value` | Bearer |
| `getBanks` | `GET /pub/bank` | Bearer |
| `resolveBankAccount` | `GET /pub/bank-account/confirm?bankId=&accountNumber=` | Bearer |
| `addBankAccount` | `POST /pub/bank-account` | Bearer |
| `getBankAccounts` | `GET /pub/bank-account` | Bearer |
| `getTokenInfo` | `GET /token/{mint}?chain=` | none |
| `submitKyc` | `POST /pub/kyc` | Bearer |
| `getAllTransactions` | `GET /pub/transactions` | Bearer |
| `getTransaction` | `GET /pub/transactions/{id}` | Bearer |
| `createOfframpOrder` | `POST /pub/offramp` | Bearer |
| `createOnrampOrder` | `POST /pub/onramp` | Bearer |
| `observeOrder` | Socket.IO, onramp only | n/a (`orderId`) |

Full request/response JSON for every endpoint is in `lib/API_REFERENCE.md` (linked above) — it is
more complete and more accurate than the root `README.md`; prefer it.

---

## 4. Offramp (crypto → fiat)

```ts
interface CreateOfframpOrder {
  bank: string;            // bank id from getBanks()
  accountNumber: string;
  currency: Currency;
  amount?: number;         // token amount — provide this OR fiatAmount
  fiatAmount?: number;
  mint: string;
  chain: Chain;            // "SOLANA" | "MONAD"
  description?: string;
  webhookURL: string;
  fee?: number;            // see §6 — renamed on the wire
}
createOfframpOrder(order: CreateOfframpOrder, sessionToken: string): Promise<OfframpOrder>
// OfframpOrder: { id, address, mint, currency, amount, fiatAmount, rate, fee }
```
Response gives a deposit wallet `address`. User sends `amount` of `mint` on `chain` to it. PAJ confirms
on-chain, pays out fiat, then calls your webhook.

Recommended best-practice sequence per `API_REFERENCE.md` §14 (not strictly required — `bank` in the
order body is a raw bank ID from `getBanks()`, not a saved-account ID):
`getBanks` → `resolveBankAccount` (confirm name) → `addBankAccount` (optional, saves it) → `createOfframpOrder`.
The bundled example (`examples/offramp/index.ts`) actually skips resolve/add and goes straight from bank
listing to order creation — both approaches work; resolve/save is for UX confidence, not a hard requirement.

---

## 5. Onramp (fiat → crypto)

```ts
interface CreateOnrampOrder {
  amount?: number;         // token amount — provide this OR fiatAmount
  fiatAmount?: number;
  currency: string;        // NOTE: typed as plain string here, not the Currency enum (see §8)
  recipient: string;       // destination wallet address
  mint: string;
  chain: Chain;
  webhookURL: string;
  fee?: number;
}
createOnrampOrder(order: CreateOnrampOrder, sessionToken: string): Promise<OnrampOrder>
// OnrampOrder: { id, accountNumber, accountName, amount, fiatAmount, bank, rate, recipient, currency, mint, fee }
```
Response gives a bank `accountNumber`/`accountName` to display to the user. User transfers `fiatAmount`
in `currency` there. PAJ detects the payment, disburses to `recipient`, then calls your webhook.

---

## 6. The `fee` → `businessUSDCFee` rename (both flows)

Both `createOfframpOrder` and `createOnrampOrder` accept an optional TypeScript field `fee`, but the
implementation destructures it out and sends it over the wire as `businessUSDCFee` instead — confirmed in
both source files and in `__tests__` (`expect(body).not.toHaveProperty("fee")`). If you're calling the raw
HTTP API directly instead of the SDK, use `businessUSDCFee`, not `fee`. Denominated in USDC per the API
reference. **What it means economically (who is charged, bounds) is not documented anywhere in the repo —
confirm with PAJ before setting it in production.**

---

## 7. Two separate real-time channels — not symmetric

**Webhooks** (`webhookURL` passed at order creation) cover **both** onramp and offramp. PAJ POSTs to your
URL as the order progresses:
```json
{ "id": "...", "address": "...", "signature": "OnChainTxSignature...", "mint": "...", "currency": "NGN",
  "amount": 100, "usdcAmount": 33.11, "fiatAmount": 152500, "sender": "...", "recipient": "...",
  "rate": 1525, "status": "COMPLETED", "transactionType": "OFF_RAMP" }
```
`status` here uses `TransactionStatus`: `INIT` | `PAID` | `COMPLETED` (all caps). The bundled example route
is `POST /webhook/paj-ramp` on **your own** server (`examples/webhook-integration/server.js`), not a PAJ endpoint.

**`observeOrder()`** is a Socket.IO alternative — **onramp only, no offramp equivalent exists anywhere in
the codebase.** It's also not mentioned in the root README (a commit literally titled "remove socket docs"
confirms this was intentional). Two things to know:
- The socket URL is **hardcoded** to `https://onramp-staging.paj.cash` in `utils/onramp-socket.ts`, regardless
  of `initializeSDK`'s environment. Switching to Production does not move this channel.
- Its status enum is a **different vocabulary** from webhooks: `OnRampStatus` = `pending`|`processing`|
  `completed`|`failed`|`cancelled` (lowercase), vs. webhook/`TransactionStatus`'s `INIT`|`PAID`|`COMPLETED`
  (uppercase, and no `failed`/`cancelled` equivalent at all). Don't write one status handler assuming both
  channels share values — they don't.
- Socket event names: `ORDER_UPDATE` (payload: `OnRampOrderUpdate`), `ERROR`, plus standard `connect`/
  `connect_error`/`disconnect`. Path: `/onramp-socket?id={orderId}`, transports `["websocket","polling"]`.

**Webhook authenticity is unresolved.** The webhook example's own README checklist says to validate
signatures "if provided by PAJ Ramp" — conditional phrasing even from the maintainer. The only `signature`
field in any documented payload is the on-chain transaction signature, not an HMAC/auth signature. The repo
does contain `generateSignature`/`verifySignature`/`getWalletBody` (Solana-keypair + `tweetnacl` based, in
`utils/`) — but grep confirms they're referenced **only in their own unit tests**, never by webhook handling,
never exported from `sdk.ts`. There is currently no built-in way to verify a webhook actually came from PAJ.
Confirm with PAJ what the intended mitigation is (IP allowlisting, shared secret, etc.) before trusting
webhook payloads in production.

---

## 8. Utility layer gotchas

- **`getTokenValue`/`getFiatValue` direction is easy to invert.** `getTokenValue` (= `getOnrampValue`,
  `GET /pub/rates/onramp-value`) converts **fiat → token**: you pass a fiat `amount`, you get back a token
  amount. `getFiatValue` (= `getOfframpValue`, `GET /pub/rates/offramp-value`) converts **token → fiat**: you
  pass a token `amount`, you get back `fiatAmount`. The bundled `examples/utility/index.ts` names its own
  local variables backwards (a variable called `tokenAmount` is actually sent as the fiat input to
  `getTokenValue`, and vice versa) — the functions are correct, the example's variable names are misleading
  if copied as-is.
- **`submitKyc` exists, is fully wired and exported, but is absent from the root README** — documented only
  in `lib/API_REFERENCE.md` §7. Fields: `idNumber`, `idType` (`BVN`|`NIN`), `country` (`NG`|`GH`|`TZ`|`KE`|`ZA`).
  Whether KYC is mandatory before placing orders, or gates order size, is **not stated anywhere** in the repo —
  don't assume a typical fintech tiering applies; ask PAJ.
- **`CreateOnrampOrder.currency` is typed `string`; `CreateOfframpOrder.currency` is typed `Currency` (enum)**
  — a real typing inconsistency between the two order-creation interfaces (confirmed directly in both files).
  Not a runtime issue, just means TypeScript won't catch a bad currency string on the onramp side.
- Dead code, don't use: `lib/utility/rate/getTokenValue.ts` is a **different, unexported function** that
  happens to share a name with the real (aliased) `getTokenValue`. It's not imported anywhere in the codebase
  — confirmed via repo-wide grep.

---

## 9. No dedicated sandbox/testnet mode — verified, not assumed

There is no `Sandbox` or `Testnet` value anywhere — only `Staging`/`Production`/`Local` (§2). Two things I
checked specifically because they matter for safe testing:

1. **The `paj-cash` GitHub org also has a repo called `Dummy_server`**, which looked like it should be the
   local mock backend `Environment.Local` implies. It is not — I cloned and read it. It's an unrelated
   Telegram-bot notification server (`package.json` literally names it `"telegram-bot-server"`; routes are
   `/api/notifications`, `/api/telegram/register`, `/api/send`, `/api/track-users` — nothing resembling
   `/pub/onramp` or any ramp endpoint). Also stale (last updated Jan 2025). There is no public mock server
   for the ramp API. `Environment.Local` just points at whatever you choose to run yourself.
2. **Nothing confirms Staging is free of real value at stake.** Every example `.env.example` (regardless of
   which environment it targets) references the same mint address, `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
   — the real Solana **mainnet** USDC mint. No separate devnet/testnet mint appears anywhere in the repo.
   This doesn't prove staging moves real funds, but there is no evidence it doesn't, either — treat Staging
   as "a separate backend for testing your integration logic," not as a confirmed no-risk sandbox, until PAJ
   confirms otherwise.

---

## 10. IMPORTANT — the `main` branch is not guaranteed to equal what `npm install` gives you

This was the single most important thing found, and it's directly verifiable:

- `main`'s `package.json` (as of this writing) declares version **1.5.3**.
- The actually published package (checked via `npm view paj_ramp version` and by downloading the real
  tarball with `npm pack paj_ramp`) is version **1.5.4**.
- `.github/workflows/publish.yml` on `main` triggers on push to a branch called **`tochi`**, not `main`.
  `git ls-remote --heads origin` confirms `tochi` exists on the remote as a distinct branch/commit from `main`.
- The published tarball's `dist/` folder contains compiled modules **with no corresponding `.ts` source
  anywhere on `main`**:
  - `lib/off_ramp/directCreateOrder.js/.d.ts` — an older, simpler offramp-order function:
    ```ts
    interface CreateOfframpOrder { bank: string; accountNumber: string; currency: Currency; amount: number; mint: string; webhookURL: string; }
    // missing: chain, fiatAmount, description, fee/businessUSDCFee — and amount is required, not optional
    export declare const createOfframpOrder: (order: CreateOfframpOrder, sessionToken: string) => Promise<OfframpOrder>;
    ```
  - `lib/utility/deprecated/{addWallet,getTXPoolAddress,getWallet,switchWalletBankAccount}.js/.d.ts` — pointing
    to what looks like an earlier wallet-keypair-based integration model, superseded by the current
    email/phone + OTP + bank-account model. (Plausible, not confirmed: this is likely also where the unused
    `getWalletBody`/`generateSignature`/`verifySignature` utilities in `utils/` originally plugged in — I could
    not find a direct code reference tying them together, so treat this connection as an inference, not a fact.)
  - Standalone `lib/utility/value/{getFiatValue,getTokenValue}.js/.d.ts` with their own simpler
    `ValueQuery`/`TokenValue`/`FiatValue` types, distinct from the currently-exported `getOnrampValue`/`getOfframpValue`.

**The reassuring part, also directly verified:** I diffed the actual published `dist/sdk.d.ts` (the real,
importable public surface — what `import { x } from 'paj_ramp'` actually resolves through) against `main`'s
`sdk.ts`, and they match exactly. None of the legacy files above are reachable through the normal import
path — you'd have to deep-import a specific dist path deliberately to reach them. **Everything in §1–§8 of
this document is accurate to what `npm install paj_ramp` gives you today.** Just don't be surprised if you
ever see wallet/deprecated code with no matching source on GitHub while poking around `node_modules/paj_ramp/dist`
— that's why, and it's not part of the supported API.

Also minor: `package.json`'s `license` field says `"ISC"`; the actual `LICENSE` file and README both say MIT.
Harmless metadata mismatch, not a functional issue.

---

## 11. Repo map — what's real vs. noise

```
sdk.ts                → real entry point / barrel export — this is the actual public API surface
lib/                  → implementation, mirrors sdk.ts exports 1:1
lib/API_REFERENCE.md  → most complete and accurate docs in the repo — prefer over root README.md
utils/                → axios client, enums, the onramp socket, unused signature/wallet utilities
examples/             → onramp, offramp, utility, webhook-integration — all runnable, all consistent with lib/
__tests__/            → confirms every request shape (headers, body, URL) referenced in this document
```
Safe to ignore: `generateWallet.js`, `test-protocol.js`, `wallet.json` at repo root are the maintainer's own
scratch/debug scripts (generate a throwaway Solana keypair; ping staging vs. production over HTTP/HTTPS).
None are imported by the SDK.

---

## 12. Open questions — confirm with PAJ directly, don't assume

1. What `businessUSDCFee` means economically (who pays it, any bounds).
2. Whether webhook payloads can be authenticated in any way (their own docs leave this open).
3. Whether KYC (`submitKyc`) is mandatory, and at what threshold if so.
4. Whether the onramp socket channel will ever point at production, or is staging-only by design.
5. Whether `apiKey` differs between Staging and Production, or is shared.
6. Whether Staging involves real funds/mainnet value or is genuinely consequence-free.

PAJ's Telegram (linked from https://paj.cash) is presented as the team's direct support channel and is
probably the fastest way to get authoritative answers to the above.

---

## Instructions for the agent using this document

- Treat §1–§8 and §10's `dist/sdk.d.ts` comparison as verified against the live published package.
- Treat §9 and the open questions in §12 as confirmed gaps — do not fill them with plausible-sounding
  assumptions; surface them back to the user instead, or ask PAJ directly via the channel above.
- If you have live repo access, re-fetch the URLs in "Sources consulted" before relying on exact field
  names — this document is a snapshot and the repo can change.
- Prefer `lib/API_REFERENCE.md` over root `README.md` wherever they'd conflict; the former is more complete.
