import { updateInboxAccount } from "@midday/db/queries";
import { triggerJob } from "@midday/job-client";
import type { Job } from "bullmq";
import { registerDynamicScheduler } from "../../schedulers/registry";
import type { InboxProviderInitialSetupPayload } from "../../schemas/inbox";
import { getDb } from "../../utils/db";
import { generateQuarterDailyCronTag } from "../../utils/generate-cron-tag";
import { BaseProcessor } from "../base";

/**
 * Initial inbox setup processor
 * Registers a dynamic scheduler for the inbox account and triggers initial sync
 */
export class InitialSetupProcessor extends BaseProcessor<InboxProviderInitialSetupPayload> {
  async process(job: Job<InboxProviderInitialSetupPayload>): Promise<{
    inboxAccountId: string;
    schedulerRegistered: boolean;
  }> {
    const { inboxAccountId } = job.data;
    const db = getDb();

    await this.updateProgress(job, 10);

    this.logger.info({ inboxAccountId }, "Starting initial inbox setup");

    // Register dynamic scheduler for this inbox account
    // The scheduler will run every 6 hours with a random minute based on account ID
    const cronPattern = generateQuarterDailyCronTag(inboxAccountId);

    await this.updateProgress(job, 30);

    try {
      await registerDynamicScheduler({
        template: "inbox-sync-scheduler",
        accountId: inboxAccountId,
        cronPattern,
      });

      this.logger.info(
        {
          inboxAccountId,
          cronPattern,
        },
        "Dynamic scheduler registered for inbox account",
      );

      await this.updateProgress(job, 60);

      // Store the scheduler job key in the database (similar to scheduleId in Trigger.dev)
      // The job key is: `inbox-sync-${inboxAccountId}`
      const schedulerJobKey = `inbox-sync-${inboxAccountId}`;

      await updateInboxAccount(db, {
        id: inboxAccountId,
        scheduleId: schedulerJobKey, // Store the BullMQ repeatable job key
      });

      await this.updateProgress(job, 80);

      // Trigger initial sync
      await triggerJob(
        "sync-scheduler",
        {
          id: inboxAccountId,
          manualSync: true,
        },
        "inbox-provider",
      );

      await this.updateProgress(job, 100);

      this.logger.info({ inboxAccountId }, "Initial inbox setup completed");

      return {
        inboxAccountId,
        schedulerRegistered: true,
      };
    } catch (error) {
      this.logger.error(
        {
          inboxAccountId,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        "Failed to register inbox scheduler",
      );

      throw error;
    }
  }
}
