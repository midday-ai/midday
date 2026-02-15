/**
 * One-time seed script to populate the institutions table from all banking providers.
 *
 * Usage:
 *   cd packages/db
 *   bun run src/scripts/seed-institutions.ts
 *
 * Required environment variables:
 *   DATABASE_SESSION_POOLER - PostgreSQL connection URL
 *   PLAID_CLIENT_ID, PLAID_SECRET, PLAID_ENVIRONMENT
 *   GOCARDLESS_SECRET_ID, GOCARDLESS_SECRET_KEY
 *   ENABLEBANKING_APPLICATION_ID, ENABLE_BANKING_KEY_CONTENT, ENABLEBANKING_REDIRECT_URL
 */

import { fetchAllInstitutions } from "@midday/banking";
import { db } from "../client";
import { upsertInstitutions } from "../queries/institutions";

async function main() {
  // Dynamic import to avoid pulling in the full client module at top level

  console.log("Starting institution seed...\n");

  const { institutions, errors } = await fetchAllInstitutions();

  for (const error of errors) {
    console.error(`  Failed to fetch ${error.provider}:`, error.error);
  }

  console.log(`\nTotal: ${institutions.length} institutions\n`);

  if (institutions.length === 0) {
    console.log("No institutions fetched. Exiting.");
    return;
  }

  const upserted = await upsertInstitutions(db, institutions);

  console.log(`\nUpserted ${upserted} institutions`);
  console.log("Seed completed successfully!");
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
