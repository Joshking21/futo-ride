/**
 * Deploys the composite indexes in firestore.indexes.json to the live project via the
 * Firestore Admin REST API, using the service-account creds already in .env.local.
 * A convenience for environments without the Firebase CLI. Idempotent: an index that
 * already exists returns ALREADY_EXISTS and is treated as success.
 *
 * Usage:
 *   npx tsx --env-file=../../.env.local src/scripts/deploy-indexes.ts
 */

import { readFileSync } from "node:fs";
import { getAdminApp } from "../lib/firebase-admin.js";

type IndexField = { fieldPath: string; order?: "ASCENDING" | "DESCENDING" };
type IndexDef = { collectionGroup: string; queryScope: string; fields: IndexField[] };

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID!;

async function accessToken(): Promise<string> {
  // firebase-admin's App credential mints an OAuth token from the service account.
  const credential = getAdminApp().options.credential!;
  const token = await credential.getAccessToken();
  return token.access_token;
}

async function main() {
  const json = JSON.parse(readFileSync(new URL("../../../../firestore.indexes.json", import.meta.url), "utf8")) as {
    indexes: IndexDef[];
  };

  const token = await accessToken();

  console.log(`\n📦 Deploying ${json.indexes.length} composite indexes to project ${projectId}\n`);
  let ok = 0;
  let already = 0;
  let failed = 0;

  for (const idx of json.indexes) {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/collectionGroups/${idx.collectionGroup}/indexes`;
    // The Admin API takes the composite fields (the implicit __name__ key is added by Firestore).
    const body = {
      queryScope: idx.queryScope,
      fields: idx.fields.map((f) => ({ fieldPath: f.fieldPath, order: f.order ?? "ASCENDING" })),
    };
    const label = `${idx.collectionGroup}(${idx.fields.map((f) => `${f.fieldPath} ${f.order ?? "ASC"}`).join(", ")})`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as { name?: string; error?: { status?: string; message?: string } };
    if (res.ok) {
      console.log(`  ✅ created  ${label}  →  ${data.name ?? "ok"}`);
      ok++;
    } else if (data.error?.status === "ALREADY_EXISTS") {
      console.log(`  ⏭️  exists   ${label}`);
      already++;
    } else {
      console.log(`  ❌ FAILED   ${label}  →  ${data.error?.status ?? res.status} ${data.error?.message ?? ""}`);
      failed++;
    }
  }

  console.log(`\n${failed === 0 ? "🎉 done" : "⚠️  some failed"} — ${ok} created, ${already} already existed, ${failed} failed`);
  console.log("Indexes build asynchronously; they may take a minute to become READY.\n");
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => { console.error("deploy-indexes crashed:", err); process.exit(1); });
