import { triggerJob, triggerJobAndWait } from "@midday/job-client";
import type { Job } from "bullmq";
import { registerDynamicScheduler } from "../../schedulers/registry";
import {
  type InitialBankSetupPayload,
  initialBankSetupSchema,
} from "../../schemas/banking";
import { generateCronTag } from "../../utils/generate-cron-tag";
import { BaseProcessor } from "../base";

/**
 * Sets up bank sync for a new connection:
 * 1. Register a daily sync scheduler for the team
 * 2. Run initial sync
 * 3. Schedule a follow-up sync (providers may take time to fetch all transactions)
 */
export class InitialBankSetupProcessor extends BaseProcessor<InitialBankSetupPayload> {
  protected getPayloadSchema() {
    return initialBankSetupSchema;
  }

  async process(job: Job<InitialBankSetupPayload>): Promise<void> {
    const { teamId, connectionId } = job.data;

    this.logger.info("Setting up bank sync", { teamId, connectionId });

    // 1. Register daily sync scheduler for this team
    // Uses a randomized cron to distribute load
    const cronPattern = generateCronTag(teamId);

    try {
      await registerDynamicScheduler({
        template: "bank-sync",
        accountId: teamId, // Using teamId as the account ID for this scheduler
        cronPattern,
      });

      this.logger.info("Registered bank sync scheduler", {
        teamId,
        cronPattern,
      });
    } catch (error) {
      // Log but don't fail - scheduler might already exist
      this.logger.warn("Failed to register scheduler (may already exist)", {
        teamId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // 2. Run initial sync (wait for completion)
    this.logger.info("Running initial sync", { connectionId });

    await triggerJobAndWait(
      "sync-connection",
      {
        connectionId,
        manualSync: true,
      },
      "banking",
      { timeout: 15 * 60 * 1000 }, // 15 minute timeout for initial sync
    );

    this.logger.info("Initial sync completed", { connectionId });

    // 3. Schedule follow-up sync
    // GoCardless, Teller, and Plaid can take several minutes to fetch all transactions
    // For Teller and Plaid we also listen on webhooks, but this ensures completeness
    await triggerJob(
      "sync-connection",
      {
        connectionId,
        manualSync: true,
      },
      "banking",
      { delay: 5 * 60 * 1000 }, // 5 minutes
    );

    this.logger.info("Scheduled follow-up sync", {
      connectionId,
      delayMinutes: 5,
    });
  }
}
