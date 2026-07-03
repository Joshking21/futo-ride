import Fastify from "fastify";
import cors from "@fastify/cors";
import { mapError } from "./lib/http.js";
import driverRoutes from "./routes/drivers.js";
import rideRoutes from "./routes/rides.js";
import paymentRoutes from "./routes/payments.js";
import incidentRoutes from "./routes/incidents.js";
import busRoutes from "./routes/buses.js";
import surgeRoutes from "./routes/surge.js";
import stopRoutes from "./routes/stops.js";
import telegramRoutes from "./routes/telegram.js";

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });

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

const port = Number(process.env.PORT) || 3001;

await app.listen({ port, host: "0.0.0.0" });
console.log(`API listening on http://localhost:${port}`);
