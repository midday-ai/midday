import { fetchAllInstitutions } from "@midday/banking";
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
 * 2. Upsert new/updated institutions (preserving popularity)
 * 3. Mark removed institutions as status: "removed"
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
    const { institutions, errors } = await fetchAllInstitutions();

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

    this.logger.info(`Fetched ${institutions.length} institutions total`);

    // 2. Upsert into DB
    const upserted = await upsertInstitutions(db, institutions);

    this.logger.info(`Upserted ${upserted} institutions`);

    // 3. Mark removed institutions
    const fetchedIds = new Set(institutions.map((i) => i.id));
    const activeIds = await getActiveInstitutionIds(db);
    const removedIds = activeIds.filter((id) => !fetchedIds.has(id));
    const removed = await markInstitutionsRemoved(db, removedIds);

    if (removed > 0) {
      this.logger.info(`Marked ${removed} institutions as removed`);
    }

    this.logger.info("Institution sync completed", { upserted, removed });

    return { upserted, removed };
  }
}
