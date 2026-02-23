import { getEligibleInboxAccounts } from "@midday/db/queries";
import { triggerJob } from "@midday/job-client";
import type { Job } from "bullmq";
import type { SyncAccountsSchedulerPayload } from "../../schemas/inbox";
import { getDb } from "../../utils/db";
import { isProduction } from "../../utils/env";
import { BaseProcessor } from "../base";

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
const BACKGROUND_PRIORITY = 10;

/**
 * Centralized scheduler that runs every 6 hours.
 * Queries for all connected inbox accounts on eligible plans and dispatches
 * individual sync jobs spread evenly across the 6-hour window.
 */
export class SyncAccountsSchedulerProcessor extends BaseProcessor<SyncAccountsSchedulerPayload> {
  async process(job: Job<SyncAccountsSchedulerPayload>): Promise<{
    eligibleAccounts: number;
    dispatched: number;
  }> {
    if (!isProduction()) {
      this.logger.info(
        "Skipping inbox sync scheduler in non-production environment",
      );
      return { eligibleAccounts: 0, dispatched: 0 };
    }

    const db = getDb();

    this.logger.info("Starting centralized inbox sync scheduler", {
      jobId: job.id,
    });

    const accounts = await getEligibleInboxAccounts(db);

    if (accounts.length === 0) {
      this.logger.info("No eligible inbox accounts found, skipping");
      return { eligibleAccounts: 0, dispatched: 0 };
    }

    this.logger.info("Found eligible inbox accounts", {
      count: accounts.length,
    });

    let dispatched = 0;

    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i]!;
      const delay = Math.round((i / accounts.length) * SIX_HOURS_MS);

      try {
        await triggerJob(
          "sync-scheduler",
          {
            id: account.id,
            manualSync: false,
          },
          "inbox-provider",
          {
            priority: BACKGROUND_PRIORITY,
            delay,
          },
        );
        dispatched++;
      } catch (error) {
        this.logger.warn("Failed to dispatch sync job for account", {
          accountId: account.id,
          teamId: account.teamId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    this.logger.info("Centralized inbox sync scheduler completed", {
      eligibleAccounts: accounts.length,
      dispatched,
      spreadOverMs: SIX_HOURS_MS,
    });

    return { eligibleAccounts: accounts.length, dispatched };
  }
}
