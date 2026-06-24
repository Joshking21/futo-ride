# API.md — Endpoint Registry

> The frontend's index of what the backend exposes (AGENTS.md §6–7). One entry per
> endpoint in `apps/api/src/routes`. Keep this and `apps/api/src/types` in sync —
> they are the frontend's contract. No Swagger; Zod schemas are the source of truth.

**Entry format:**

```
### POST /<resource>
Auth:  required (Firebase ID token) | none
Body:  { ... }
200:   { ok: true, data: { ... } }
4xx:   { ok: false, error: string }
Notes: validation rules, side effects, gotchas.
```

---

_No endpoints yet — add one entry here for every route handler you create._
