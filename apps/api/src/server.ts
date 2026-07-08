import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { mapError } from "./lib/http.js";
import driverRoutes from "./routes/drivers.js";
import rideRoutes from "./routes/rides.js";
import paymentRoutes from "./routes/payments.js";
import incidentRoutes from "./routes/incidents.js";
import busRoutes from "./routes/buses.js";
import surgeRoutes from "./routes/surge.js";
import stopRoutes from "./routes/stops.js";
import telegramRoutes from "./routes/telegram.js";
import meRoutes from "./routes/me.js";

const app = Fastify({ logger: true });

// Treat an empty JSON body as {} instead of erroring. No-body POSTs (e.g.
// /rides/:id/cancel) sent with `Content-Type: application/json` would otherwise
// 500 with FST_ERR_CTP_EMPTY_JSON_BODY. Routes still Zod-validate their bodies.
// We also stash the raw string on the request so the Monnify webhook can verify
// its HMAC signature over the exact bytes (§20.2).
app.addContentTypeParser(
  "application/json",
  { parseAs: "string" },
  (req, body: string, done) => {
    (req as typeof req & { rawBody?: string }).rawBody = body;
    if (!body || body.trim() === "") return done(null, {});
    try {
      done(null, JSON.parse(body));
    } catch (err) {
      done(err as Error, undefined);
    }
  },
);

await app.register(cors, { origin: true });

// Rate limiting (§20.12). Scoped, not global — heartbeats (driver/bus location)
// must not be throttled — only opted-in routes set `config.rateLimit`. Key by the
// bearer token (≈ per user) so one abusive client can't spam SOS/booking.
await app.register(rateLimit, {
  global: false,
  keyGenerator: (req) => (req.headers.authorization as string) ?? req.ip,
  errorResponseBuilder: () => ({ ok: false, error: "Too many requests, slow down" }),
});

/** Global error handler — maps HttpError, ZodError to the standard envelope. */
app.setErrorHandler((error, _request, reply) => {
  const { status, body } = mapError(error);
  return reply.status(status).send(body);
});

/** Health check — no auth required. */
app.get("/health", async () => ({ ok: true, data: { status: "ok" } }));

await app.register(driverRoutes);
await app.register(rideRoutes);
await app.register(paymentRoutes);
await app.register(incidentRoutes);
await app.register(busRoutes);
await app.register(surgeRoutes);
await app.register(stopRoutes);
await app.register(telegramRoutes);
await app.register(meRoutes);

const port = Number(process.env.PORT) || 3001;

await app.listen({ port, host: "0.0.0.0" });
console.log(`API listening on http://localhost:${port}`);
