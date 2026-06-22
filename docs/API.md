# API.md — Endpoint Registry

> The frontend's index of what exists (AGENTS.md §6–7). One entry per endpoint
> in `/app/api`. Keep this, `/types`, and `/lib/api.ts` in sync — that trio is
> the frontend's contract. No Swagger; Zod schemas are the source of truth.

**Entry format:**

```
### POST /api/<resource>
Auth:  required (Firebase ID token) | none
Body:  { ... }
200:   { ok: true, data: { ... } }
4xx:   { ok: false, error: string }
Notes: validation rules, side effects, gotchas.
```

---

_No endpoints yet — add one entry here for every route handler you create._
