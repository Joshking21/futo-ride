# CONVENTIONS.md — Backend Coding Conventions

> Backend = **Next.js (App Router, TypeScript)** Route Handlers / Server Actions in a **monorepo**.
> These are *conventions* (stable). Anything version-specific (exact Next.js / SDK APIs) must be **verified against the installed version** — see `AGENTS.md` §4–5. Don't trust remembered signatures.

---

## 1. Language & runtime

- **TypeScript only.** `strict` mode on. No `any` without a one-line `// reason:` comment.
- Route Handlers that use the Firebase **Admin SDK** or other Node-only libs must run on the **Node runtime** (not Edge). Set the runtime explicitly per the current Next.js docs — **verify the directive for your installed version** rather than assuming.
- `async/await` everywhere; never leave a floating promise.

---

## 2. Folder structure (mirror the plan)

```
/app
  /(rider)            rider UI (later)
  /(driver)           driver UI (later)
  /api
    /<resource>/route.ts      e.g. /api/rides/route.ts
/lib
  firebaseClient.ts   client SDK init (reads/auth)
  firebaseAdmin.ts    admin SDK init (server writes/verify)
  auth.ts             verifyRequest() — checks the Firebase ID token
  http.ts             ok() / fail() response helpers
  api.ts              typed client the frontend imports (the wiring layer)
  monnify.ts          Monnify client (verify endpoints first)
  alerta.ts           Alerta client (verify endpoints first)
  aiTriage.ts         LLM incident triage
  geo.ts              Turf helpers (distance, nearest, ETA)
  campusStops.ts      hardcoded building coords
  routes.ts           bus routes (ordered stop ids)
/types
  index.ts            shared data types
/docs
  PROJECT_PLAN.md
  API.md              endpoint registry (you maintain this)
```

One concern per file. Shared logic goes in `/lib`, never duplicated across routes.

---

## 3. Naming

- **Files:** kebab-case (`ride-options.ts`). Route folders match the resource (`/api/rides`).
- **Types / interfaces:** PascalCase (`Ride`, `Incident`).
- **Functions / variables:** camelCase. Booleans read as questions (`isOnline`, `hasPaid`).
- **Env vars:** SCREAMING_SNAKE_CASE.
- **Constants:** SCREAMING_SNAKE for true constants; otherwise camelCase.

---

## 4. API route pattern

Every protected handler follows the same shape: **verify auth → validate input → do work → return the standard envelope**. (Treat this as the *pattern*; confirm Next.js specifics for your version.)

```ts
// /app/api/rides/route.ts  (illustrative pattern, not version-pinned)
import { z } from "zod";
import { verifyRequest } from "@/lib/auth";
import { ok, fail } from "@/lib/http";

const BookRide = z.object({
  fromStop: z.string(),
  toStop: z.string(),
  payMethod: z.enum(["naira", "cngn"]),
  priorityFee: z.number().nonnegative().optional(),
});

export async function POST(req: Request) {
  try {
    const user = await verifyRequest(req);          // throws if token invalid
    const body = BookRide.parse(await req.json());   // throws on bad input
    if (body.fromStop === body.toStop) return fail("from and to must differ", 400);

    // ...business logic (match nearest keke, fare, surge)...

    return ok({ rideId, driverId, etaMin, fare });
  } catch (e) {
    return fail(e);   // never leak stack/secret; log server-side
  }
}
```

---

## 5. Validation — Zod

- **Every** request body / query / param is parsed with a Zod schema. No unvalidated input reaches logic.
- Infer types from schemas where practical (`z.infer<typeof BookRide>`) so the contract has one source of truth.
- Keep schemas colocated with their route (or in `/lib` if shared) so OpenAPI could be generated from them later if ever needed.

---

## 6. Response shape (one envelope everywhere)

```ts
// success
{ ok: true,  data: T }
// failure
{ ok: false, error: string }
```

Helpers in `/lib/http.ts`: `ok(data, status=200)` and `fail(err, status=400)`. `fail` maps known errors to clean messages and **never** returns a stack trace, secret, or raw third-party error to the client.

Status codes: `200` success · `400` bad input · `401` missing/invalid token · `403` not allowed · `404` not found · `409` conflict · `500` unexpected.

---

## 7. Auth

- Protected routes call `verifyRequest(req)` first. It reads the `Authorization: Bearer <idToken>` header and verifies it with the Firebase **Admin SDK** (`verifyIdToken`) — **verify the exact method name/signature against the installed `firebase-admin` version.**
- The verified `uid` is the source of identity. Never trust a `userId` sent in the body.
- The backend **verifies** tokens; it never **issues** them.

---

## 8. Firebase usage rules

- **Client SDK** (`/lib/firebaseClient.ts`) → reads + realtime subscriptions + auth, used by the **frontend only**.
- **Admin SDK** (`/lib/firebaseAdmin.ts`) → privileged writes + token verification, used by the **backend only**.
- Never mix them. Never write authoritative data from the client; route it through a Route Handler.
- Firestore is **schemaless** — enforce shape with Zod + `/types`. No JOINs: denormalise instead.

---

## 9. Error handling & logging

- Wrap handler bodies in `try/catch`; convert to the standard `fail` envelope.
- Log full errors **server-side** (console or a logger); send only a safe message to the client.
- Validate external-service responses too — don't assume Monnify/Alerta/LLM returned what you expect; handle their failure paths.

---

## 10. Secrets & env

- All secrets via `process.env`, read **only** in server code. Client may read `NEXT_PUBLIC_*` only.
- Never hardcode keys; never commit `.env`. Keep `.env.example` updated with **names + comments, no values**.

---

## 11. Documentation (the human cares about this)

- **JSDoc** on every exported function: what it does, params, returns, throws.
- **Comments explain *why*, not *what*** — skip narrating obvious code; document decisions, gotchas, and any verified-API quirks.
- **Comments are short and rare.** No decorative banners or separator lines (`// ======`, ASCII art, section dividers). No multi-line essays — if a comment is creeping toward ~5 lines, you're writing a novel: cut it, or simplify the code so it doesn't need explaining. One concise line where the code genuinely can't speak for itself. JSDoc on exports is the exception (it's structured, kept tight).
- After each task, update **`docs/API.md`** (per `AGENTS.md` §6 format).
- **No Swagger** for now (see `AGENTS.md` §7) — Zod + `API.md` + JSDoc is the bar.

---

## 12. Versions & freshness

- Pin nothing from memory. Before using a library feature, check its **installed version** and **current docs**.
- If installed behaviour differs from these conventions or the plan, **the installed library wins** — adapt and tell the human.
- Prefer the smallest dependency set that does the job; ask before adding a new dependency.

---

## 13. Commits (light, but clean)

- Conventional-commit style: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`.
- Small, scoped commits — one logical change each. Don't bundle unrelated edits.

---

*Conventions are the stable contract; versions are not. When in doubt, verify live and ask.*
