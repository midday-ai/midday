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

    this.logger.info("Starting initial inbox setup", { inboxAccountId });

    // Register dynamic scheduler for this inbox account
    // The scheduler will run every 6 hours with a random minute based on account ID
    const cronPattern = generateQuarterDailyCronTag(inboxAccountId);

    try {
      await registerDynamicScheduler({
        template: "inbox-sync-scheduler",
        accountId: inboxAccountId,
        cronPattern,
      });

      this.logger.info("Dynamic scheduler registered for inbox account", {
        inboxAccountId,
        cronPattern,
      });

      // Store the scheduler job key in the database (similar to scheduleId in Trigger.dev)
      // The job key is: `inbox-sync-${inboxAccountId}`
      const schedulerJobKey = `inbox-sync-${inboxAccountId}`;

      await updateInboxAccount(db, {
        id: inboxAccountId,
        scheduleId: schedulerJobKey, // Store the BullMQ repeatable job key
      });

      // Trigger initial sync
      await triggerJob(
        "sync-scheduler",
        {
          id: inboxAccountId,
          manualSync: true,
        },
        "inbox-provider",
      );

      this.logger.info("Initial inbox setup completed", { inboxAccountId });

      return {
        inboxAccountId,
        schedulerRegistered: true,
      };
    } catch (error) {
      this.logger.error("Failed to register inbox scheduler", {
        inboxAccountId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      throw error;
    }
  }
}
