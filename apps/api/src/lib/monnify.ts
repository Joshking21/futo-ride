/** Monnify (Moniepoint) — naira payments. (Driver disbursement is a future step, §20.2.) */

import { createHmac, timingSafeEqual } from "node:crypto";

let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Verifies a Monnify webhook's `monnify-signature` header: an HMAC-SHA512 of the
 * RAW request body keyed with the Monnify secret key (verified: developers.monnify.com
 * → Webhooks). MONNIFY_WEBHOOK_SECRET overrides the key if your dashboard sets a
 * distinct one; otherwise the client secret key is used.
 */
export function verifyMonnifySignature(rawBody: string, signature: unknown): boolean {
  if (typeof signature !== "string" || !signature) return false;
  const key = process.env.MONNIFY_WEBHOOK_SECRET || process.env.MONNIFY_SECRET_KEY;
  if (!key) return false;
  const computed = createHmac("sha512", key).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(computed);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function getConfig() {
  const apiKey = process.env.MONNIFY_API_KEY;
  const secretKey = process.env.MONNIFY_SECRET_KEY;
  const contractCode = process.env.MONNIFY_CONTRACT_CODE;
  const baseUrl = process.env.MONNIFY_BASE_URL ?? "https://sandbox.monnify.com";
  if (!apiKey || !secretKey || !contractCode) {
    throw new Error("Missing Monnify credentials");
  }
  return { apiKey, secretKey, contractCode, baseUrl };
}

/** Authenticates with Monnify; caches the bearer token until expiry. */
export async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const { apiKey, secretKey, baseUrl } = getConfig();
  const credentials = Buffer.from(`${apiKey}:${secretKey}`).toString("base64");

  const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: { Authorization: `Basic ${credentials}` },
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Monnify auth failed: ${res.status} ${detail}`);
  }

  const json = (await res.json()) as {
    responseBody: { accessToken: string; expiresIn: number };
  };
  const { accessToken, expiresIn } = json.responseBody;
  cachedToken = { token: accessToken, expiresAt: Date.now() + (expiresIn - 60) * 1000 };
  return accessToken;
}

/** Init a payment — returns checkout URL and transaction ref. */
export async function initTransaction(params: {
  amount: number;
  customerEmail: string;
  customerName: string;
  paymentReference: string; // unique merchant-side reference (Monnify requires this)
  paymentDescription: string;
  redirectUrl: string;
}): Promise<{ checkoutUrl: string; transactionReference: string }> {
  const { baseUrl, contractCode } = getConfig();
  const token = await getAccessToken();

  const res = await fetch(`${baseUrl}/api/v1/merchant/transactions/init-transaction`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      ...params,
      contractCode,
      currencyCode: "NGN",
      paymentMethods: ["CARD", "ACCOUNT_TRANSFER"],
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Monnify init-transaction failed: ${res.status} ${detail}`);
  }

  const json = (await res.json()) as {
    responseBody: { checkoutUrl: string; transactionReference: string };
  };
  return json.responseBody;
}

/** Verify a transaction's payment status. */
export async function verifyTransaction(
  transactionReference: string,
): Promise<{ paymentStatus: string; amountPaid: number }> {
  const { baseUrl } = getConfig();
  const token = await getAccessToken();

  const res = await fetch(
    `${baseUrl}/api/v2/transactions/${encodeURIComponent(transactionReference)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Monnify verify failed: ${res.status} ${detail}`);
  }

  const json = (await res.json()) as {
    responseBody: { paymentStatus: string; amountPaid: number };
  };
  return json.responseBody;
}
