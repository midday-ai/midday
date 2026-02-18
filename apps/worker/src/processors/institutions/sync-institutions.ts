import { fetchAllInstitutions, syncInstitutionLogos } from "@midday/banking";
import {
  getActiveInstitutionIds,
  markInstitutionsRemoved,
  upsertInstitutions,
} from "@midday/db/queries";
import type { Job } from "bullmq";
import { getDb } from "../../utils/db";
import { isProduction } from "../../utils/env";
import { BaseProcessor } from "../base";

type SyncInstitutionsPayload = Record<string, never>;

/**
 * Scheduled processor that syncs institutions from banking providers
 * into the PostgreSQL institutions table.
 *
 * Runs daily to:
 * 1. Fetch latest institutions from all providers
 * 2. Sync logos to R2 for new institutions only
 * 3. Upsert new/updated institutions (preserving popularity)
 * 4. Mark removed institutions as status: "removed"
 */
export class SyncInstitutionsProcessor extends BaseProcessor<SyncInstitutionsPayload> {
  async process(
    _job: Job<SyncInstitutionsPayload>,
  ): Promise<{ upserted: number; removed: number }> {
    if (!isProduction()) {
      this.logger.info(
        "Skipping institution sync in non-production environment",
      );
      return { upserted: 0, removed: 0 };
    }

    const db = getDb();

    this.logger.info("Starting institution sync");

    // 1. Fetch from all providers
    const { institutions, errors, succeededProviders } =
      await fetchAllInstitutions();

    for (const error of errors) {
      this.logger.error(`Failed to fetch ${error.provider} institutions`, {
        error: error.error,
      });
    }

    if (institutions.length === 0) {
      this.logger.warn(
        "No institutions fetched from any provider, skipping sync",
      );
      return { upserted: 0, removed: 0 };
    }

    this.logger.info(
      `Fetched ${institutions.length} institutions from ${succeededProviders.length} providers (${succeededProviders.join(", ")})`,
    );

    if (errors.length > 0) {
      this.logger.warn(
        `${errors.length} provider(s) failed; removal will only apply to succeeded providers`,
      );
    }

    // 2. Sync logos to R2 for new institutions only
    const existingIds = new Set(
      await getActiveInstitutionIds(db, succeededProviders),
    );
    const newInstitutions = institutions.filter(
      (inst) => !existingIds.has(inst.id),
    );

    if (newInstitutions.length > 0) {
      this.logger.info(
        `Syncing logos for ${newInstitutions.length} new institutions`,
      );

      const logoResult = await syncInstitutionLogos(newInstitutions, {
        concurrency: 5,
      });

      this.logger.info("Logo sync completed", {
        uploaded: logoResult.uploaded,
        skipped: logoResult.skipped,
        failed: logoResult.failed,
      });
    }

    // 3. Upsert and mark removed in a transaction to prevent inconsistent state
    // Only mark institutions as removed for providers that successfully returned data.
    // This prevents a transient outage of a single provider from incorrectly
    // removing all of that provider's institutions.
    const result = await db.transaction(async (tx) => {
      const upserted = await upsertInstitutions(tx, institutions);

      this.logger.info(`Upserted ${upserted} institutions`);

      const fetchedIds = new Set(institutions.map((i) => i.id));
      const activeIds = await getActiveInstitutionIds(tx, succeededProviders);
      const removedIds = activeIds.filter((id) => !fetchedIds.has(id));
      const removed = await markInstitutionsRemoved(tx, removedIds);

      if (removed > 0) {
        this.logger.info(`Marked ${removed} institutions as removed`);
      }

      return { upserted, removed };
    });

    this.logger.info("Institution sync completed", result);

    return result;
  }
}
