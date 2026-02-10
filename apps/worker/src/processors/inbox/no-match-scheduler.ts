import { updateInboxStatusToNoMatch } from "@midday/db/queries";
import type { Job } from "bullmq";
import { subDays } from "date-fns";
import type { NoMatchSchedulerPayload } from "../../schemas/inbox";
import { getDb } from "../../utils/db";
import { isProduction } from "../../utils/env";
import { BaseProcessor } from "../base";

/**
 * Scheduled task that runs daily to update inbox items to "no_match" status
 * after they have been pending for 90 days without finding a matching transaction.
 *
 * This provides closure to users and keeps the system clean by marking items
 * that are unlikely to ever find matches due to the age of the data.
 */
export class NoMatchSchedulerProcessor extends BaseProcessor<NoMatchSchedulerPayload> {
  async process(_job: Job<NoMatchSchedulerPayload>): Promise<{
    updatedCount: number;
    cutoffDate: string;
  }> {
    // Only run in production
    if (!isProduction()) {
      this.logger.info(
        "Skipping no-match scheduler in non-production environment",
      );
      return { updatedCount: 0, cutoffDate: new Date().toISOString() };
    }

    const db = getDb();

    // Calculate the date 90 days ago using date-fns
    const ninetyDaysAgo = subDays(new Date(), 90);

    this.logger.info("Starting no-match scheduler", {
      cutoffDate: ninetyDaysAgo.toISOString(),
    });

    // Find inbox items that are:
    // 1. In "pending" status (waiting for matches)
    // 2. Created more than 90 days ago
    // 3. Not already matched to a transaction
    const result = await updateInboxStatusToNoMatch(db, {
      cutoffDate: ninetyDaysAgo.toISOString(),
    });

    this.logger.info("No-match scheduler completed", {
      updatedCount: result.updatedCount,
      cutoffDate: ninetyDaysAgo.toISOString(),
      sampleUpdatedItems: result.updatedItems.slice(0, 5).map((item) => ({
        id: item.id,
        teamId: item.teamId,
        displayName: item.displayName,
        createdAt: item.createdAt,
      })),
    });

    // Log some statistics for monitoring
    if (result.updatedItems.length > 0) {
      const teamCounts = result.updatedItems.reduce(
        (acc, item) => {
          if (item.teamId) {
            acc[item.teamId] = (acc[item.teamId] || 0) + 1;
          }
          return acc;
        },
        {} as Record<string, number>,
      );

      this.logger.info("No-match scheduler team breakdown", {
        teamCounts,
        totalTeams: Object.keys(teamCounts).length,
      });
    }

    return {
      updatedCount: result.updatedCount,
      cutoffDate: ninetyDaysAgo.toISOString(),
    };
  }
}
