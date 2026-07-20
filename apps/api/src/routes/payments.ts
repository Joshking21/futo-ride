import type { FastifyInstance, FastifyRequest } from "fastify";
import { FieldValue } from "firebase-admin/firestore";
import { verifyRequest } from "../lib/auth.js";
import { adminDb } from "../lib/firestore.js";
import { ok, HttpError } from "../lib/http.js";
import { koboToNaira, nairaToKobo } from "../lib/money.js";
import { getProvider, type WebhookContext } from "../lib/payment-provider.js";
import { mockFiatDeposit } from "../lib/partna.js";
import { sendPush } from "../lib/fcm.js";
import { InitPayment, VerifyPayment } from "../schemas/payments.js";
import type { Payment, Ride } from "../types/index.js";

const PAYABLE_STATUSES = new Set<Ride["status"]>(["assigned", "arriving", "started"]);
const ACTIVE_STATUSES = new Set<Ride["status"]>(["assigned", "arriving", "started"]);

/**
 * Reconciles a provider onramp against our stored Payment (shared by /verify and the webhook,
 * §21). Reads the authoritative status server-to-server via the active provider (never trusts a
 * webhook body's amounts). TWO TIERS so the rider isn't blocked on the USDC conversion:
 *   • FIAT RECEIVED (naira in) → stamp the ride PAID and unlock completion immediately.
 *   • SETTLED (USDC delivered) → the on-chain leg; recorded here, credits nobody (the driver
 *     ledger is credited at ride completion, not here).
 * If money lands for a ride that already expired/cancelled and was never paid, it flags
 * `refundPending` instead of reviving a dead ride (C3). `event` is the webhook event/status hint
 * (used by Partna's fiat-received signal). Keyed by `providerRef` (Partna: our ref; PAJ: order id).
 */
async function reconcile(
  providerRef: string,
  event?: string,
): Promise<{ status: string; amountKobo: number; paid: boolean }> {
  const provider = getProvider();
  const status = await provider.getOnrampStatus(providerRef, event);
  const db = adminDb();
  const snap = await db.collection("payments").where("providerRef", "==", providerRef).limit(1).get();
  if (snap.empty || !status) return { status: status?.raw ?? "unknown", amountKobo: 0, paid: false };

  const payment = snap.docs[0].data() as Payment;
  const amountKobo = nairaToKobo(status.amountNaira);
  const amountCovers = amountKobo >= payment.amount;

  // Tier 1: the rider's naira is confirmed in — unlock the ride NOW, before USDC settles.
  const fiatReceived = amountCovers && status.fiatReceived;
  // Tier 2: USDC has actually landed on Solana — the treasury leg (blocks no rider).
  const settled = amountCovers && status.settled;

  await snap.docs[0].ref.update({
    status: settled ? "SETTLED" : fiatReceived ? "PAID" : status.raw,
    // Persist the live rate the rider settled at so ride completion can size the on-chain
    // welfare cut at the real FX (PAJ `rate`) — no static rate anywhere in the project.
    ...(status.rate && status.rate > 0 ? { paidRate: status.rate } : {}),
  });

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
      // so a later settlement webhook can't mis-flag a settled ride as refund-pending.
      await rideRef.set({ refundPending: true }, { merge: true });
    }
  }

  // TODO(vault): on `settled`, the fiat→USDC conversion has funded the treasury — PAJ gives the
  // live rate + net USDC (status.usdcBaseUnits / status.rate) to record here when the on-chain
  // welfare sweep lands. Nothing to credit at the payment edge today.

  return { status: status.raw, amountKobo, paid: fiatReceived };
}

/** Naira collection via the active provider (NGN → USDC treasury). Kobo internally; naira at the edge. */
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

    const provider = getProvider();

    // Deterministic payment doc per ride (M10) → idempotent, no duplicate order on retry.
    const ref = db.collection("payments").doc(ride.id);
    const reference = `futoride-${ride.id}`;
    const existing = await ref.get();
    if (existing.exists) {
      const p = existing.data() as Payment;
      if (p.providerRef) {
        return ok({
          provider: p.provider,
          reference: p.ref,
          checkoutUrl: p.checkoutUrl,
          bankDetails: p.bankAccountNumber
            ? { accountNumber: p.bankAccountNumber, accountName: p.bankAccountName, bank: p.bankName }
            : undefined,
        });
      }
    }

    const created = await provider.createOnramp({ amountNaira: koboToNaira(ride.fare), reference, rideId: ride.id });
    const payment: Payment = {
      id: ref.id,
      rideId: ride.id,
      method: "naira",
      amount: ride.fare, // kobo
      status: "pending",
      ref: reference,
      provider: provider.name,
      providerRef: created.providerRef,
      ...(created.checkoutUrl ? { checkoutUrl: created.checkoutUrl } : {}),
      ...(created.bankDetails
        ? {
            bankAccountNumber: created.bankDetails.accountNumber,
            bankAccountName: created.bankDetails.accountName,
            bankName: created.bankDetails.bank,
          }
        : {}),
    };
    await ref.set(payment);

    return ok({
      provider: provider.name,
      reference,
      checkoutUrl: created.checkoutUrl,
      bankDetails: created.bankDetails,
    });
  });

  app.post("/payments/verify", async (req) => {
    const user = await verifyRequest(req);
    const body = VerifyPayment.parse(req.body);

    // Ownership check (N3): the reference must belong to the caller's ride. `reference` is OUR
    // ref (futoride-<rideId>); we reconcile by the payment's providerRef.
    const db = adminDb();
    const snap = await db.collection("payments").where("ref", "==", body.reference).limit(1).get();
    if (snap.empty) throw new HttpError("Payment not found", 404);
    const payment = snap.docs[0].data() as Payment;
    const ride = (await db.collection("rides").doc(payment.rideId).get()).data() as Ride | undefined;
    if (ride?.riderId !== user.uid) throw new HttpError("Not your payment", 403);
    if (!payment.providerRef) throw new HttpError("Payment not initialized", 409);

    const { status, amountKobo, paid } = await reconcile(payment.providerRef);
    return ok({ status, amount: amountKobo, paid });
  });

  // Server-to-server: the active provider calls this on onramp status changes. Verified by the
  // provider (Partna: RSA-PSS signature; PAJ: Bearer secret header), then reconciled from the
  // authoritative status. Always 200 once handled so the provider doesn't retry a settled event;
  // idempotent by providerRef.
  app.post("/payments/webhook", async (req: FastifyRequest, reply) => {
    const provider = getProvider();
    const ctx: WebhookContext = { body: req.body, headers: req.headers };
    if (!provider.verifyWebhook(ctx)) {
      return reply.status(401).send({ ok: false, error: "Unauthorized" });
    }
    const { providerRef, event } = provider.parseWebhook(ctx);
    req.log.info({ provider: provider.name, providerRef, event }, "payment webhook received");
    if (providerRef) {
      await reconcile(providerRef, event).catch((err) => req.log.error({ err }, "payment webhook reconcile failed"));
    }
    return ok({ ok: true });
  });

  // Staging-only demo helper (§21) — Partna ONLY (PAJ has no mock deposit). Simulates the rider's
  // NGN bank transfer so Partna fires the real onramp webhook, without a human completing checkout.
  app.post("/payments/mock-deposit", async (req) => {
    const user = await verifyRequest(req);
    const body = InitPayment.parse(req.body);

    if (getProvider().name !== "partna") throw new HttpError("Mock deposit is only supported for Partna", 400);
    const base = process.env.PARTNA_BASE_URL ?? "https://staging-api.getpartna.com/v4";
    if (!base.includes("staging")) throw new HttpError("Mock deposit is staging-only", 403);

    const db = adminDb();
    const ride = (await db.collection("rides").doc(body.rideId).get()).data() as Ride | undefined;
    if (!ride) throw new HttpError("Ride not found", 404);
    if (ride.riderId !== user.uid) throw new HttpError("Not your ride", 403);

    await mockFiatDeposit(koboToNaira(ride.fare));
    return ok({ ok: true });
  });

  // Development-only bypass: instantly marks a ride as PAID without dealing with a provider.
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
      provider: getProvider().name,
      providerRef: `bypass-${ride.id}`,
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
