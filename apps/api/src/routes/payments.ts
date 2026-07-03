import type { FastifyInstance } from "fastify";
import { verifyRequest } from "../lib/auth.js";
import { adminDb } from "../lib/firestore.js";
import { ok, HttpError } from "../lib/http.js";
import { koboToNaira, nairaToKobo } from "../lib/money.js";
import { initTransaction, verifyTransaction } from "../lib/monnify.js";
import { InitPayment, VerifyPayment } from "../schemas/payments.js";
import type { Payment, Ride } from "../types/index.js";

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

    const redirectUrl = process.env.MONNIFY_REDIRECT_URL;
    if (!redirectUrl) throw new HttpError("Payment not configured", 500);

    // Our payment doc id doubles as the unique paymentReference Monnify requires.
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
      ref: transactionReference, // Monnify's transactionReference — used by /verify
    };
    await ref.set(payment);

    return ok({ checkoutUrl, reference: transactionReference });
  });

  app.post("/payments/verify", async (req) => {
    await verifyRequest(req);
    const body = VerifyPayment.parse(req.body);

    const { paymentStatus, amountPaid } = await verifyTransaction(body.reference);

    const db = adminDb();
    const snap = await db
      .collection("payments")
      .where("ref", "==", body.reference)
      .limit(1)
      .get();
    if (!snap.empty) {
      await snap.docs[0].ref.update({ status: paymentStatus });
    }

    return ok({ status: paymentStatus, amount: nairaToKobo(amountPaid) });
  });
}
