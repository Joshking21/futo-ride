import Fastify from "fastify";
import cors from "@fastify/cors";
import { HttpError, mapError } from "./lib/http.js";

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });

/** Global error handler — maps HttpError, ZodError to the standard envelope. */
app.setErrorHandler((error, _request, reply) => {
  const { status, body } = mapError(error);
  return reply.status(status).send(body);
});

/** Health check — no auth required. */
app.get("/health", async () => ({ ok: true, data: { status: "ok" } }));

// TODO: register route modules as they land
// await app.register(rideRoutes);
// await app.register(driverRoutes);
// await app.register(incidentRoutes);
// await app.register(paymentRoutes);

const port = Number(process.env.PORT) || 3001;

await app.listen({ port, host: "0.0.0.0" });
console.log(`API listening on http://localhost:${port}`);
