import type { FastifyInstance, FastifyRequest } from "fastify";
import { FieldValue } from "firebase-admin/firestore";
import { verifyRequest } from "../lib/auth.js";
import { adminDb } from "../lib/firestore.js";
import { ok, HttpError } from "../lib/http.js";
import { koboToNaira, nairaToKobo } from "../lib/money.js";
import {
  buildOnrampCheckoutUrl,
  getRampByReference,
  verifyPartnaWebhook,
  isOnrampSettled,
  isFiatReceived,
  mockFiatDeposit,
  type PartnaWebhook,
} from "../lib/partna.js";
import { sendPush } from "../lib/fcm.js";
import { InitPayment, VerifyPayment } from "../schemas/payments.js";
import type { Payment, Ride } from "../types/index.js";

const PAYABLE_STATUSES = new Set<Ride["status"]>(["assigned", "arriving", "started"]);
const ACTIVE_STATUSES = new Set<Ride["status"]>(["assigned", "arriving", "started"]);

/**
 * Reconciles a Partna onramp against our stored Payment (shared by /verify and the
 * webhook, §21). Reads the authoritative ramp status server-to-server (never trusts a
 * webhook body's amounts). TWO TIERS so the rider isn't blocked on the USDC conversion:
 *   • FIAT RECEIVED (naira in) → stamp the ride PAID and unlock completion immediately.
 *   • USDC SETTLED (`completed`) → the on-chain leg; recorded here, credits nobody (the
 *     driver ledger is credited at ride completion, not here).
 * If money lands for a ride that already expired/cancelled and was never paid, it flags
 * `refundPending` instead of reviving a dead ride (C3). `event` is the webhook event name
 * (e.g. "deposit") when called from the webhook — used as the fiat-received signal.
 */
async function reconcile(
  reference: string,
  event?: string,
): Promise<{ status: string; amountKobo: number; paid: boolean }> {
  const ramp = await getRampByReference(reference);
  const db = adminDb();
  const snap = await db.collection("payments").where("ref", "==", reference).limit(1).get();
  if (snap.empty || !ramp) return { status: ramp?.status ?? "unknown", amountKobo: 0, paid: false };

  const payment = snap.docs[0].data() as Payment;
  const amountKobo = nairaToKobo(ramp.fromAmountNaira);
  const amountCovers = amountKobo >= payment.amount;

  // Tier 1: the rider's naira is confirmed in — unlock the ride NOW, before USDC settles.
  const fiatReceived = amountCovers && isFiatReceived(ramp.status, ramp.confirmed, event);
  // Tier 2: USDC has actually landed on Solana — the treasury leg (blocks no rider).
  const settled = amountCovers && isOnrampSettled(ramp.status);

  await snap.docs[0].ref.update({ status: settled ? "SETTLED" : fiatReceived ? "PAID" : ramp.status });

  if (fiatReceived) {
    const rideRef = db.collection("rides").doc(payment.rideId);
    const ride = (await rideRef.get()).data() as Ride | undefined;
    if (ride && ACTIVE_STATUSES.has(ride.status)) {
      await rideRef.set({ paymentStatus: "PAID", expiresAt: FieldValue.delete() }, { merge: true });
      // FCM: notify the rider that the payment cleared.
      await sendPush(ride.riderId, {
        title: "✅ Payment confirmed",
        body: `We received your ₦${(amountKobo / 100).toFixed(2)} payment. Your driver can see it now.`,
        data: { type: "payment_confirmed", rideId: ride.id },
      });
    } else if (ride && ride.paymentStatus !== "PAID") {
      // Money arrived for a ride that already expired/cancelled and was never paid — owe a
      // refund, don't revive it (C3). A ride already PAID (incl. completed) is left untouched,
      // so the later `completed` webhook can't mis-flag a settled ride as refund-pending.
      await rideRef.set({ refundPending: true }, { merge: true });
    }
  }

  // TODO(partna-verify): when the on-chain treasury (PDA) lands, hook the USDC deposit here on
  // `settled` — the fiat→USDC settlement is what funds the welfare vault. Nothing to credit today.

  return { status: ramp.status, amountKobo, paid: fiatReceived };
}

/** Naira collection via Partna onramp (NGN → USDC treasury). Kobo internally; naira at the edge. */
export default async function paymentRoutes(app: FastifyInstance) {
  app.post("/payments/init", async (req) => {
    const user = await verifyRequest(req);
    const body = InitPayment.parse(req.body);

    const db = adminDb();
    const rideRef = db.collection("rides").doc(body.rideId);
    const rideSnap = await rideRef.get();
    if (!rideSnap.exists) throw new HttpError("Ride not found", 404);

    const ride = rideSnap.data() as Ride;
    if (ride.riderId !== user.uid) throw new HttpError("Not your ride", 403);
    if (!PAYABLE_STATUSES.has(ride.status)) throw new HttpError("Ride is not payable", 409);

    // Deterministic payment doc per ride (M10) → idempotent, no duplicate ramp on retry.
    const ref = db.collection("payments").doc(ride.id);
    const reference = `futoride-${ride.id}`;
    const existing = await ref.get();
    if (existing.exists) {
      const p = existing.data() as Payment;
      if (p.checkoutUrl) return ok({ checkoutUrl: p.checkoutUrl, reference: p.ref });
    }

    const checkoutUrl = buildOnrampCheckoutUrl({ amountNaira: koboToNaira(ride.fare), reference });
    const payment: Payment = {
      id: ref.id,
      rideId: ride.id,
      method: "naira",
      amount: ride.fare, // kobo
      status: "pending",
      ref: reference,
      checkoutUrl,
    };
    await ref.set(payment);

    return ok({ checkoutUrl, reference });
  });

  app.post("/payments/verify", async (req) => {
    const user = await verifyRequest(req);
    const body = VerifyPayment.parse(req.body);

    // Ownership check (N3): the reference must belong to the caller's ride.
    const db = adminDb();
    const snap = await db.collection("payments").where("ref", "==", body.reference).limit(1).get();
    if (snap.empty) throw new HttpError("Payment not found", 404);
    const payment = snap.docs[0].data() as Payment;
    const ride = (await db.collection("rides").doc(payment.rideId).get()).data() as Ride | undefined;
    if (ride?.riderId !== user.uid) throw new HttpError("Not your payment", 403);

    const { status, amountKobo, paid } = await reconcile(body.reference);
    return ok({ status, amount: amountKobo, paid });
  });

  // Server-to-server: Partna calls this on onramp status changes. Verified by an
  // RSA-PSS/SHA-256 signature over the JSON `data` field (Partna's public key), then
  // reconciled from the authoritative ramp status. Always 200 once handled so Partna
  // doesn't retry a settled event; idempotent by reference.
  app.post("/payments/webhook", async (req: FastifyRequest, reply) => {
    const body = req.body as PartnaWebhook;
    if (!verifyPartnaWebhook(body)) {
      return reply.status(401).send({ ok: false, error: "Unauthorized" });
    }
    const event = (body.event ?? "").toLowerCase();
    const reference = body.data?.rampReference as string | undefined;
    // TODO(partna-verify): confirm on staging that the `Deposit` (fiat-received) event carries
    // `data.rampReference` so it correlates to our ride — if it uses a different key, map it here.
    // This log captures the real event/status/confirmed order for that verification.
    req.log.info(
      { event, reference, status: body.data?.status, confirmed: body.data?.confirmed },
      "partna webhook received",
    );
    // Deposit = naira received (unlocks the ride early); Onramp = USDC settled (treasury leg).
    if (reference && (event === "onramp" || event === "deposit")) {
      await reconcile(reference, event).catch((err) => req.log.error({ err }, "partna webhook reconcile failed"));
    }
    return ok({ ok: true });
  });

  // Staging-only demo helper (§21): simulates the rider's NGN bank transfer so Partna
  // fires the real onramp webhook, without a human completing the hosted checkout.
  app.post("/payments/mock-deposit", async (req) => {
    const user = await verifyRequest(req);
    const body = InitPayment.parse(req.body);

    const base = process.env.PARTNA_BASE_URL ?? "https://staging-api.getpartna.com/v4";
    if (!base.includes("staging")) throw new HttpError("Mock deposit is staging-only", 403);

    const db = adminDb();
    const ride = (await db.collection("rides").doc(body.rideId).get()).data() as Ride | undefined;
    if (!ride) throw new HttpError("Ride not found", 404);
    if (ride.riderId !== user.uid) throw new HttpError("Not your ride", 403);

    await mockFiatDeposit(koboToNaira(ride.fare));
    return ok({ ok: true });
  });

  // Development-only bypass: instantly marks a ride as PAID without dealing with Partna.
  app.post("/payments/bypass", async (req) => {
    if (process.env.ENABLE_PAYMENT_BYPASS !== "true") {
      throw new HttpError("Bypass endpoint is disabled in this environment", 403);
    }
    const user = await verifyRequest(req);
    const body = InitPayment.parse(req.body);

    const db = adminDb();
    const rideRef = db.collection("rides").doc(body.rideId);
    const rideSnap = await rideRef.get();
    
    if (!rideSnap.exists) throw new HttpError("Ride not found", 404);
    const ride = rideSnap.data() as Ride;
    if (ride.riderId !== user.uid) throw new HttpError("Not your ride", 403);
    if (!ACTIVE_STATUSES.has(ride.status)) throw new HttpError("Ride is not payable", 409);

    // 1. Mark ride as PAID
    await rideRef.set({ paymentStatus: "PAID", expiresAt: FieldValue.delete() }, { merge: true });
    
    // 2. Mock a successful payment document
    const ref = db.collection("payments").doc(ride.id);
    const payment: Payment = {
      id: ref.id,
      rideId: ride.id,
      method: "naira",
      amount: ride.fare,
      status: "PAID",
      ref: `bypass-${ride.id}`,
      checkoutUrl: "",
    };
    await ref.set(payment);

    // 3. Send the FCM confirmation
    await sendPush(ride.riderId, {
      title: "✅ Payment confirmed",
      body: `Bypass mode: ₦${(ride.fare / 100).toFixed(2)} payment confirmed. Your driver can see it now.`,
      data: { type: "payment_confirmed", rideId: ride.id },
    });

    return ok({ ok: true, bypassed: true });
  });
}
