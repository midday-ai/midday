/**
 * Seed script to populate the institutions table from all banking providers.
 *
 * Fetches institutions from all providers, syncs logos to R2, and upserts
 * to the database.
 *
 * Usage:
 *   cd packages/db
 *   bun run src/scripts/seed-institutions.ts
 *
 * Required environment variables:
 *   DATABASE_PRIMARY_URL - PostgreSQL connection URL
 *   PLAID_CLIENT_ID, PLAID_SECRET, PLAID_ENVIRONMENT
 *   GOCARDLESS_SECRET_ID, GOCARDLESS_SECRET_KEY
 *   ENABLEBANKING_APPLICATION_ID, ENABLE_BANKING_KEY_CONTENT, ENABLEBANKING_REDIRECT_URL
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
 */

import { fetchAllInstitutions, syncInstitutionLogos } from "@midday/banking";
import { db } from "../client";
import { upsertInstitutions } from "../queries/institutions";

async function main() {
  // 1. Fetch institutions from all providers
  console.log("Fetching institutions from providers...");
  const { institutions, errors } = await fetchAllInstitutions();

  for (const error of errors) {
    console.error(`  Failed to fetch ${error.provider}:`, error.error);
  }

  console.log(`Fetched ${institutions.length} institutions.\n`);

  if (institutions.length === 0) {
    console.log("No institutions fetched. Exiting.");
    return;
  }

  // 2. Sync logos to R2 (batched, concurrency 10)
  console.log("Syncing logos to R2...");
  const logoResult = await syncInstitutionLogos(institutions, {
    concurrency: 10,
  });

  console.log(
    `Logos: ${logoResult.uploaded} uploaded, ${logoResult.skipped} skipped, ${logoResult.failed} failed.\n`,
  );

  // 3. Upsert institutions to DB
  console.log("Upserting institutions to database...");
  const upserted = await upsertInstitutions(db, institutions);

  console.log(`Upserted ${upserted} institutions.`);
  console.log("\nSeed completed successfully!");
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
