# FUTO-Ride

Campus keke pooling, bus tracking, payments (Partna NGN onramp → USDC treasury),
safety incidents and Telegram alerts.

- `apps/api` — Fastify + Zod backend
- `apps/frontend`, `apps/mobile` — clients
- `docs/` — API reference (`API.md`, `openapi.yaml`) and project docs

## API docs (Swagger)

The OpenAPI 3.0 spec lives at [`docs/openapi.yaml`](docs/openapi.yaml). To view the
interactive Swagger UI, serve the `docs/` folder over HTTP (the page fetches the YAML,
which a `file://` open would block) and visit **http://localhost:8080/swagger.html**:

```bash
npx http-server docs -p 8080
# then open http://localhost:8080/swagger.html
```

Alternatives:

```bash
# Redoc preview (no static server needed)
npx @redocly/cli preview-docs docs/openapi.yaml

# Validate the spec
npx @redocly/cli lint docs/openapi.yaml
```

You can also import `docs/openapi.yaml` directly into Postman or Insomnia.

## Run the backend

```bash
pnpm --filter @futo-ride/api dev   # http://localhost:3001
```

Authed endpoints need a Firebase ID token — send `Authorization: Bearer <idToken>`
(in Swagger UI, use the **Authorize** button).
