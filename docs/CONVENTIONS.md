# CONVENTIONS.md — Backend Coding Conventions

> Backend = **Fastify (TypeScript)**, a standalone API server living in **`apps/api`** of the `futo-ride` monorepo.
> These are *conventions* (stable). Anything version-specific (exact Fastify / Firebase / SDK APIs) must be **verified against the installed version** — see `AGENTS.md` §4–5. Don't trust remembered signatures.
> This governs `apps/api` only. `apps/mobile` is the frontend dev's app — out of scope.

---

## 1. Language & runtime

- **TypeScript only**, `strict` on. No `any` without a one-line `// reason:`.
- **Fastify** server, bootstrapped in `apps/api/src/server.ts`.
- `async/await`; no floating promises.

---

## 2. Folder structure

```
apps/api/src/
  server.ts          Fastify bootstrap + plugin/route registration
  lib/
    http.ts          ok() / fail() envelope + HttpError   (Layer 0)
    firebase-admin.ts Admin SDK singleton, adminAuth()     (Layer 0)
    auth.ts          verifyRequest() — verifies the ID token (Layer 0)
    monnify.ts       Monnify client (verify endpoints first)
    alerta.ts        Alerta client (verify endpoints first)
    ai-triage.ts     LLM incident triage
    geo.ts           Turf helpers (distance, nearest, ETA)
    campus-stops.ts  hardcoded building coords
    routes-data.ts   bus routes (ordered stop ids)
  types/
    index.ts         shared data models (User, Driver, Ride, …)
  routes/
    <resource>.ts    one module per resource (rides, drivers, incidents, …)
  schemas/
    <resource>.ts    Zod schemas (colocated or here if shared)
```

One concern per file. Shared logic in `lib/`, never duplicated across routes.

---

## 3. Naming

- **Files:** kebab-case (`ride-options.ts`).
- **Types/interfaces:** PascalCase (`Ride`, `Incident`).
- **Functions/variables:** camelCase; booleans read as questions (`isOnline`, `hasPaid`).
- **Env vars:** SCREAMING_SNAKE_CASE.

---

## 4. Route pattern

Every protected route follows: **verify auth → validate input → do work → return the envelope.** Treat the code below as the *pattern* — confirm Fastify's current route/hook API against the installed version.

```ts
// apps/api/src/routes/rides.ts  (illustrative — verify Fastify specifics)
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { verifyRequest } from "../lib/auth";
import { ok, fail, HttpError } from "../lib/http";

const BookRide = z.object({
  fromStop: z.string(),
  toStop: z.string(),
  payMethod: z.enum(["naira", "cngn"]),
  priorityFee: z.number().nonnegative().optional(),
});

export default async function rideRoutes(app: FastifyInstance) {
  app.post("/rides", async (req, reply) => {
    try {
      const user = await verifyRequest(req);          // throws if token invalid
      const body = BookRide.parse(req.body);           // throws on bad input
      if (body.fromStop === body.toStop) throw new HttpError(400, "from and to must differ");

      // ...business logic (match nearest keke, fare, surge)...

      return ok({ rideId, driverId, etaMin, fare });
    } catch (e) {
      return fail(e);   // maps ZodError + HttpError to clean messages; never leaks internals
    }
  });
}
```

Register route modules in `server.ts`. Prefer one module per resource.

---

## 5. Validation — Zod

- **Every** body/query/param is parsed with a Zod schema. No unvalidated input reaches logic.
- Infer types from schemas where practical (`z.infer<typeof BookRide>`).
- Keep schemas colocated with their route (or in `schemas/` if shared) so OpenAPI could be generated later if ever needed.

---

## 6. Response shape (one envelope — Layer 0 already provides this)

```ts
{ ok: true,  data: T }      // success
{ ok: false, error: string } // failure
```

Use `ok(data)` / `fail(err)` from `lib/http.ts`. `fail` maps `ZodError` and `HttpError` to clean messages and **never** returns a stack trace, secret, or raw third-party error to the client.

Status codes: `200` ok · `400` bad input · `401` missing/invalid token · `403` not allowed · `404` not found · `409` conflict · `500` unexpected.

---

## 7. Auth (Layer 0 already wires this)

- Protected routes call `verifyRequest(req)` first — it reads `Authorization: Bearer <idToken>` and verifies it via the Admin SDK, returning the trusted identity.
- The verified `uid` is the source of identity. **Never** trust a `userId` from the body.
- The backend **verifies** tokens; it never **issues** them.

---

## 8. Firebase usage

- Use the **Admin SDK** (`lib/firebase-admin.ts`) for privileged writes + token verification.
- The mobile app reads realtime data **directly** from Firebase — that's not our code. Don't build read endpoints for data the client can subscribe to itself, unless there's a real reason (logic, secrets).
- Firestore is **schemaless** — enforce shape with Zod + `types/`. No JOINs: denormalise.

---

## 9. Error handling & logging

- Wrap route bodies in `try/catch` → `fail()`.
- Log full errors **server-side**; send only safe messages out.
- Validate external-service responses (Monnify/Alerta/LLM) — handle their failure paths; don't assume success.

---

## 10. Secrets & env

- All secrets via `process.env`, read only in `apps/api`. Never hardcode; never commit `.env`.
- Keep `.env.example` updated with **names + comments, no values**.

---

## 11. Documentation & comments

- **JSDoc** on exported functions (purpose, params, returns, throws) — kept tight.
- **Comments are short and rare.** No decorative banners or separator lines, no multi-line essays — if a comment nears ~5 lines, simplify the code instead. One concise line where the code can't speak for itself.
- Comments explain *why*, not *what*.
- After each task update `docs/API.md` (and `docs/BACKEND_INTEGRATION.md` if mobile-facing). **No Swagger** (see `AGENTS.md` §7).

---

## 12. Versions & freshness

- Pin nothing from memory. Verify Fastify, Firebase, Zod, and any client lib against the **installed version** before use.
- If installed behaviour differs from these conventions, **the installed library wins** — adapt and tell the human.
- Ask before adding a dependency; prefer the smallest set.

---

## 13. Commits

- Conventional-commit style: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`. Small, scoped commits.

---

*Conventions are the stable contract; versions are not. When in doubt, verify live and ask.*