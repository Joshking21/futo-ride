import type { FastifyInstance, FastifyRequest } from "fastify";
import { FieldValue } from "firebase-admin/firestore";
import { verifyRequest } from "../lib/auth.js";
import { adminDb } from "../lib/firestore.js";
import { ok, HttpError } from "../lib/http.js";
import { koboToNaira, nairaToKobo } from "../lib/money.js";
import { initTransaction, verifyTransaction, verifyMonnifySignature } from "../lib/monnify.js";
import { InitPayment, VerifyPayment } from "../schemas/payments.js";
import type { Payment, Ride } from "../types/index.js";

const PAYABLE_STATUSES = new Set<Ride["status"]>(["assigned", "arriving", "started"]);

/**
 * Reconciles a Monnify transaction against our stored Payment (shared by /verify and
 * the webhook, §20.2). Marks the payment PAID + stamps the ride paymentStatus:"PAID"
 * (clearing its TTL) ONLY when Monnify says PAID and the amount covers the fare.
 */
async function reconcile(reference: string): Promise<{ status: string; amountKobo: number; paid: boolean }> {
  const { paymentStatus, amountPaid } = await verifyTransaction(reference);
  const amountKobo = nairaToKobo(amountPaid);

  const db = adminDb();
  const snap = await db.collection("payments").where("ref", "==", reference).limit(1).get();
  if (snap.empty) return { status: paymentStatus, amountKobo, paid: false };

  const payment = snap.docs[0].data() as Payment;
  const settled = paymentStatus === "PAID" || paymentStatus === "OVERPAID";
  const paid = settled && amountKobo >= payment.amount;

  await snap.docs[0].ref.update({ status: paid ? "PAID" : paymentStatus });
  if (paid) {
    await db
      .collection("rides")
      .doc(payment.rideId)
      .set({ paymentStatus: "PAID", expiresAt: FieldValue.delete() }, { merge: true });
  }
  return { status: paymentStatus, amountKobo, paid };
}

/** Naira payments via Monnify. Money is kobo internally; convert only at the Monnify edge. */
export default async function paymentRoutes(app: FastifyInstance) {
  app.post("/payments/init", async (req) => {
    const user = await verifyRequest(req);
    const body = InitPayment.parse(req.body);

    const db = adminDb();
    const rideSnap = await db.collection("rides").doc(body.rideId).get();
    if (!rideSnap.exists) throw new HttpError("Ride not found", 404);

    const ride = rideSnap.data() as Ride;
    if (ride.riderId !== user.uid) throw new HttpError("Not your ride", 403);
    if (!PAYABLE_STATUSES.has(ride.status)) throw new HttpError("Ride is not payable", 409);

    const redirectUrl = process.env.MONNIFY_REDIRECT_URL;
    if (!redirectUrl) throw new HttpError("Payment not configured", 500);

    // Idempotent (§20.2): reuse an existing open payment for this ride — no double-charge.
    const existing = await db
      .collection("payments")
      .where("rideId", "==", ride.id)
      .where("status", "in", ["pending", "PAID"])
      .limit(1)
      .get();
    if (!existing.empty) {
      const p = existing.docs[0].data() as Payment;
      if (p.checkoutUrl) return ok({ checkoutUrl: p.checkoutUrl, reference: p.ref });
    }

    const ref = db.collection("payments").doc();
    const paymentReference = `futoride-${ref.id}`;

    const { checkoutUrl, transactionReference } = await initTransaction({
      amount: koboToNaira(ride.fare), // Monnify expects naira
      customerEmail: user.email ?? "rider@futo-ride.app",
      customerName: user.email ?? user.uid,
      paymentReference,
      paymentDescription: `Keke ride ${ride.fromStop} to ${ride.toStop}`,
      redirectUrl,
    });

    const payment: Payment = {
      id: ref.id,
      rideId: ride.id,
      method: "naira",
      amount: ride.fare, // kobo
      status: "pending",
      ref: transactionReference,
      checkoutUrl,
    };
    await ref.set(payment);

    return ok({ checkoutUrl, reference: transactionReference });
  });

  app.post("/payments/verify", async (req) => {
    await verifyRequest(req);
    const body = VerifyPayment.parse(req.body);

    const { status, amountKobo, paid } = await reconcile(body.reference);
    return ok({ status, amount: amountKobo, paid });
  });

  // Server-to-server: Monnify calls this on transaction completion. Verified by the
  // monnify-signature header (HMAC-SHA512 of the raw body), then reconciled via the
  // authoritative verify API. Always 200 once handled so Monnify doesn't retry.
  app.post("/payments/webhook", async (req: FastifyRequest, reply) => {
    const rawBody = (req as FastifyRequest & { rawBody?: string }).rawBody ?? "";
    const signature = req.headers["monnify-signature"];
    if (!verifyMonnifySignature(rawBody, signature)) {
      return reply.status(401).send({ ok: false, error: "Unauthorized" });
    }

    const body = req.body as { eventData?: { transactionReference?: string } };
    const reference = body?.eventData?.transactionReference;
    if (reference) {
      await reconcile(reference).catch((err) => req.log.error({ err }, "webhook reconcile failed"));
    }
    return ok({ ok: true });
  });
}
