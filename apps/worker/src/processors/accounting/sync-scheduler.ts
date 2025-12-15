import { getApps } from "@midday/db/queries";
import { triggerJob } from "@midday/job-client";
import type { Job } from "bullmq";
import type { AccountingSyncSchedulerPayload } from "../../schemas/accounting";
import { getDb } from "../../utils/db";
import { BaseProcessor } from "../base";

/**
 * Accounting sync scheduler processor
 * Triggered by dynamic scheduler for each team with accounting integrations
 * Fans out to sync-accounting-transactions job for each connected provider
 */
export class AccountingSyncSchedulerProcessor extends BaseProcessor<AccountingSyncSchedulerPayload> {
  async process(job: Job<AccountingSyncSchedulerPayload>): Promise<{
    teamId: string;
    providersTriggered: string[];
    syncedAt: string;
  }> {
    const { teamId, manualSync = false } = job.data;
    const db = getDb();

    if (!teamId) {
      throw new Error("teamId is required");
    }

    this.logger.info("Starting accounting sync scheduler", {
      teamId,
      manualSync,
    });

    // Get all connected apps for this team
    const apps = await getApps(db, teamId);

    // Filter to only accounting providers that are configured
    const accountingProviders = ["xero", "quickbooks", "fortnox", "visma"];
    const connectedAccountingApps = apps.filter(
      (app) =>
        accountingProviders.includes(app.app_id) &&
        app.config &&
        // Check if auto-sync is enabled (default true)
        this.isAutoSyncEnabled(app.settings)
    );

    if (connectedAccountingApps.length === 0) {
      this.logger.info("No accounting providers with auto-sync enabled", {
        teamId,
      });
      return {
        teamId,
        providersTriggered: [],
        syncedAt: new Date().toISOString(),
      };
    }

    const providersTriggered: string[] = [];

    // Trigger sync job for each connected accounting provider
    for (const app of connectedAccountingApps) {
      try {
        await triggerJob(
          "sync-accounting-transactions",
          {
            teamId,
            providerId: app.app_id,
            includeAttachments: this.shouldSyncAttachments(app.settings),
            manualSync,
          },
          "accounting"
        );

        providersTriggered.push(app.app_id);

        this.logger.info("Triggered accounting sync for provider", {
          teamId,
          providerId: app.app_id,
        });
      } catch (error) {
        this.logger.error("Failed to trigger accounting sync for provider", {
          teamId,
          providerId: app.app_id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        // Continue with other providers even if one fails
      }
    }

    this.logger.info("Accounting sync scheduler completed", {
      teamId,
      providersTriggered,
      totalProviders: connectedAccountingApps.length,
    });

    return {
      teamId,
      providersTriggered,
      syncedAt: new Date().toISOString(),
    };
  }

  /**
   * Check if auto-sync is enabled in settings
   */
  private isAutoSyncEnabled(settings: unknown): boolean {
    if (!settings || !Array.isArray(settings)) {
      return true; // Default to enabled
    }

    const autoSyncSetting = settings.find(
      (s: { id?: string }) => s.id === "autoSync"
    );

    if (!autoSyncSetting) {
      return true; // Default to enabled
    }

    return (autoSyncSetting as { value?: boolean }).value !== false;
  }

  /**
   * Check if attachment sync is enabled in settings
   */
  private shouldSyncAttachments(settings: unknown): boolean {
    if (!settings || !Array.isArray(settings)) {
      return true; // Default to enabled
    }

    const attachmentSetting = settings.find(
      (s: { id?: string }) => s.id === "syncAttachments"
    );

    if (!attachmentSetting) {
      return true; // Default to enabled
    }

    return (attachmentSetting as { value?: boolean }).value !== false;
  }
}

