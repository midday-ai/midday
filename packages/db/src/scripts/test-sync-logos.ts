/**
 * Full sync: fetch EnableBanking institutions, sync logos to R2, upsert to DB.
 *
 * Usage:
 *   cd packages/db/src/scripts
 *   bun run test-sync-logos.ts
 */

import { createHash } from "node:crypto";
import {
  EnableBankingApi,
  getLogoURL,
  type InstitutionRecord,
  syncInstitutionLogos,
} from "@midday/banking";
import { db } from "../client";
import { upsertInstitutions } from "../queries/institutions";

async function main() {
  console.log("Fetching EnableBanking institutions...");

  const api = new EnableBankingApi();
  const data = await api.getInstitutions();

  console.log(`Fetched ${data.length} EnableBanking institutions.\n`);

  const institutions: InstitutionRecord[] = data.flatMap((institution) => {
    const hashId = createHash("md5")
      .update(`${institution.name}-${institution.country}`)
      .digest("hex")
      .slice(0, 12);

    const logo = getLogoURL(encodeURIComponent(institution.name), "png");

    return (institution.psu_types ?? []).map((psuType: string) => ({
      id: psuType === "business" ? hashId : `${hashId}-personal`,
      name: institution.name,
      logo,
      sourceLogo: institution.logo ?? null,
      provider: "enablebanking" as const,
      countries: [institution.country],
      availableHistory: null,
      maximumConsentValidity: institution.maximum_consent_validity ?? null,
      popularity: 10000,
      type: psuType,
    }));
  });

  console.log(`Mapped to ${institutions.length} institution records.\n`);

  // 1. Sync logos to R2
  console.log("Syncing logos to R2...");
  const logoResult = await syncInstitutionLogos(institutions, {
    concurrency: 10,
  });
  console.log(
    `Logos: ${logoResult.uploaded} uploaded, ${logoResult.skipped} skipped, ${logoResult.failed} failed.\n`,
  );

  // 2. Upsert to DB
  console.log("Upserting to database...");
  const upserted = await upsertInstitutions(db, institutions);
  console.log(`Upserted ${upserted} institutions.\n`);

  console.log("Done!");
}

main().catch((error) => {
  console.error("Failed:", error);
  process.exit(1);
});
