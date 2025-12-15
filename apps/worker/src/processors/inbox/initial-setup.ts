import { getInboxAccountInfo, updateInboxAccount } from "@midday/db/queries";
import { triggerJob } from "@midday/job-client";
import type { Job } from "bullmq";
import { registerDynamicScheduler } from "../../schedulers/registry";
import type { InboxProviderInitialSetupPayload } from "../../schemas/inbox";
import { getDb } from "../../utils/db";
import { generateQuarterDailyCronTag } from "../../utils/generate-cron-tag";
import { BaseProcessor } from "../base";

/**
 * Initial inbox setup processor
 * Registers a dynamic scheduler for the team (if not already registered) and triggers initial sync
 */
export class InitialSetupProcessor extends BaseProcessor<InboxProviderInitialSetupPayload> {
  async process(job: Job<InboxProviderInitialSetupPayload>): Promise<{
    inboxAccountId: string;
    schedulerRegistered: boolean;
  }> {
    const { inboxAccountId } = job.data;
    const db = getDb();

    this.logger.info("Starting initial inbox setup", { inboxAccountId });

    // Get account info to access teamId
    const accountInfo = await getInboxAccountInfo(db, { id: inboxAccountId });

    if (!accountInfo) {
      throw new Error("Account not found");
    }

    const { teamId } = accountInfo;

    // Register dynamic scheduler for this team (if not already registered)
    // The scheduler will run every 6 hours with a random minute based on teamId
    const cronPattern = generateQuarterDailyCronTag(teamId);
    const schedulerJobKey = `inbox-sync-${teamId}`;

    try {
      // Check if scheduler already exists by trying to register (registry will skip if exists)
      await registerDynamicScheduler({
        template: "inbox-sync-scheduler",
        accountId: teamId, // Reusing generic parameter name, but semantically it's teamId
        cronPattern,
      });

      this.logger.info("Dynamic scheduler registered for team", {
        teamId,
        inboxAccountId,
        cronPattern,
        schedulerJobKey,
      });

      // No need to store scheduleId in inbox_accounts (scheduler is team-level)
      // Still update lastAccessed for the account
      await updateInboxAccount(db, {
        id: inboxAccountId,
        lastAccessed: new Date().toISOString(),
      });

      // Trigger initial sync for this specific account (manual sync)
      await triggerJob(
        "sync-scheduler",
        {
          id: inboxAccountId,
          manualSync: true,
        },
        "inbox-provider",
      );

      this.logger.info("Initial inbox setup completed", {
        inboxAccountId,
        teamId,
      });

      return {
        inboxAccountId,
        schedulerRegistered: true,
      };
    } catch (error) {
      this.logger.error("Failed to register inbox scheduler", {
        inboxAccountId,
        teamId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      throw error;
    }
  }
}
