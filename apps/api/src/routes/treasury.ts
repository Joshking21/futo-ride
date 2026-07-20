import type { FastifyInstance } from "fastify";
import { ok } from "../lib/http.js";
import { isVaultConfigured, getVaultState } from "../lib/vault.js";

/**
 * Public transparency read on the on-chain welfare vault (todo.md S2). No auth — the
 * whole point is that anyone can verify the fund's live balance on-chain. Returns
 * `configured:false` when the vault env isn't set (the naira flow runs without it).
 */
export default async function treasuryRoutes(app: FastifyInstance) {
  app.get("/treasury/balance", async () => {
    if (!isVaultConfigured()) return ok({ configured: false });
    const state = await getVaultState();
    return ok({ configured: true, ...state });
  });
}
