/**
 * Payment-provider abstraction — lets the collection flow (routes/payments.ts) run on either
 * **Partna** or **PAJ** without knowing which. Selected by `PAYMENT_PROVIDER` (default `paj`).
 *
 * The two providers differ in ways this interface hides:
 *   • Correlation:  Partna uses OUR reference (`futoride-<rideId>`); PAJ assigns its own order
 *     `id`. Both are surfaced as `providerRef` — what we store + correlate webhooks by.
 *   • Rider UX:     Partna returns a hosted `checkoutUrl`; PAJ returns `bankDetails` to display.
 *   • Webhook auth: Partna = RSA-PSS over `data`; PAJ = a `Bearer <secret>` header.
 *   • Status words: normalized here into `{ fiatReceived, settled }` so the two-tier reconcile
 *     (early unlock on fiat-in, treasury leg on settlement) is provider-agnostic.
 *
 * Money is naira at this edge; kobo internally (see lib/money.ts).
 */
import {
  buildOnrampCheckoutUrl,
  getRampByReference,
  verifyPartnaWebhook,
  isOnrampSettled,
  isFiatReceived,
  type PartnaWebhook,
} from "./partna.js";
import {
  createPajOnramp,
  getPajTransaction,
  isPajFiatReceived,
  isPajSettled,
  verifyPajWebhook,
} from "./paj.js";

export type PaymentProviderName = "partna" | "paj";

export type CreateOnrampInput = {
  amountNaira: number;
  reference: string; // our futoride-<rideId>
  rideId: string;
};

export type BankDetails = { accountNumber: string; accountName: string; bank: string };

export type CreateOnrampResult = {
  providerRef: string; // stored + used to correlate webhooks (Partna: == reference; PAJ: order id)
  checkoutUrl?: string; // Partna hosted widget
  bankDetails?: BankDetails; // PAJ display
};

/** Normalized onramp status — the route ANDs `fiatReceived`/`settled` with its own amount check. */
export type ProviderStatus = {
  raw: string;
  fiatReceived: boolean; // naira in → early ride unlock
  settled: boolean; // USDC delivered → treasury leg
  amountNaira: number; // fiat the provider reports for this order
  usdcBaseUnits?: number; // net USDC delivered (6dp), when known (PAJ)
  rate?: number; // NGN per USD locked, when known (PAJ)
};

export type WebhookContext = {
  body: unknown;
  headers: Record<string, string | string[] | undefined>;
};

export interface PaymentProvider {
  readonly name: PaymentProviderName;
  /** Create a collection order for a ride's fare. */
  createOnramp(input: CreateOnrampInput): Promise<CreateOnrampResult>;
  /** Authoritative status by providerRef (server-to-server; never trusts webhook amounts).
   *  `event` is an optional webhook hint (Partna's fiat-received event name). */
  getOnrampStatus(providerRef: string, event?: string): Promise<ProviderStatus | null>;
  /** Verify a webhook is genuinely from the provider. */
  verifyWebhook(ctx: WebhookContext): boolean;
  /** Extract our correlation key + event hint from a (verified) webhook. */
  parseWebhook(ctx: WebhookContext): { providerRef?: string; event?: string };
}

/** Partna adapter — wraps lib/partna.ts. providerRef == our reference. */
const partnaProvider: PaymentProvider = {
  name: "partna",
  async createOnramp({ amountNaira, reference }) {
    const checkoutUrl = buildOnrampCheckoutUrl({ amountNaira, reference });
    return { providerRef: reference, checkoutUrl };
  },
  async getOnrampStatus(providerRef, event) {
    const ramp = await getRampByReference(providerRef);
    if (!ramp) return null;
    return {
      raw: ramp.status,
      fiatReceived: isFiatReceived(ramp.status, ramp.confirmed, event),
      settled: isOnrampSettled(ramp.status),
      amountNaira: ramp.fromAmountNaira,
    };
  },
  verifyWebhook({ body }) {
    return verifyPartnaWebhook(body as PartnaWebhook);
  },
  parseWebhook({ body }) {
    const b = body as PartnaWebhook;
    return { providerRef: b.data?.rampReference as string | undefined, event: (b.event ?? "").toLowerCase() };
  },
};

/** PAJ adapter — wraps lib/paj.ts. providerRef == PAJ order id. */
const pajProvider: PaymentProvider = {
  name: "paj",
  async createOnramp({ amountNaira }) {
    const treasury = process.env.TREASURY_SOLANA_ADDRESS;
    if (!treasury) throw new Error("Missing TREASURY_SOLANA_ADDRESS");
    const webhookURL = process.env.PAYMENTS_WEBHOOK_URL;
    if (!webhookURL) throw new Error("Missing PAYMENTS_WEBHOOK_URL (public URL of /payments/webhook)");
    const order = await createPajOnramp({ amountNaira, recipient: treasury, webhookURL });
    return {
      providerRef: order.id,
      bankDetails: { accountNumber: order.accountNumber, accountName: order.accountName, bank: order.bank },
    };
  },
  async getOnrampStatus(providerRef) {
    const tx = await getPajTransaction(providerRef);
    if (!tx) return null;
    return {
      raw: tx.status,
      fiatReceived: isPajFiatReceived(tx.status),
      settled: isPajSettled(tx.status, tx.signature),
      amountNaira: tx.fiatAmountNaira,
      usdcBaseUnits: Math.round((tx.usdcAmount ?? 0) * 1e6),
      rate: tx.rate,
    };
  },
  verifyWebhook({ headers }) {
    return verifyPajWebhook(headers);
  },
  parseWebhook({ body }) {
    const b = body as { id?: string; status?: string };
    return { providerRef: b.id, event: b.status ? String(b.status).toLowerCase() : undefined };
  },
};

/** The active provider, chosen by PAYMENT_PROVIDER (default `paj`). */
export function getProvider(): PaymentProvider {
  const name = (process.env.PAYMENT_PROVIDER ?? "paj").toLowerCase();
  return name === "partna" ? partnaProvider : pajProvider;
}
