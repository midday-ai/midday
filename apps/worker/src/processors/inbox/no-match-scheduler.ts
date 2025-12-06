import { inbox } from "@midday/db/schema";
import type { Job } from "bullmq";
import { subDays } from "date-fns";
import { and, eq, lt, sql } from "drizzle-orm";
import type { NoMatchSchedulerPayload } from "../../schemas/inbox";
import { getDb } from "../../utils/db";
import { BaseProcessor } from "../base";

/**
 * Scheduled task that runs daily to update inbox items to "no_match" status
 * after they have been pending for 90 days without finding a matching transaction.
 *
 * This provides closure to users and keeps the system clean by marking items
 * that are unlikely to ever find matches due to the age of the data.
 */
export class NoMatchSchedulerProcessor extends BaseProcessor<NoMatchSchedulerPayload> {
  async process(job: Job<NoMatchSchedulerPayload>): Promise<{
    updatedCount: number;
    cutoffDate: string;
  }> {
    // Only run in production
    if (process.env.NODE_ENV !== "production" && !process.env.FLY_APP_NAME) {
      this.logger.info(
        "Skipping no-match scheduler in non-production environment",
      );
      return { updatedCount: 0, cutoffDate: new Date().toISOString() };
    }

    const db = getDb();

    await this.updateProgress(job, 10);

    // Calculate the date 90 days ago using date-fns
    const ninetyDaysAgo = subDays(new Date(), 90);

    this.logger.info("Starting no-match scheduler", {
      cutoffDate: ninetyDaysAgo.toISOString(),
    });

    await this.updateProgress(job, 30);

    // Find inbox items that are:
    // 1. In "pending" status (waiting for matches)
    // 2. Created more than 90 days ago
    // 3. Not already matched to a transaction
    const result = await db
      .update(inbox)
      .set({
        status: "no_match",
      })
      .where(
        and(
          eq(inbox.status, "pending"),
          lt(inbox.createdAt, ninetyDaysAgo.toISOString()),
          // Make sure they're not already matched
          sql`${inbox.transactionId} IS NULL`,
        ),
      )
      .returning({
        id: inbox.id,
        teamId: inbox.teamId,
        displayName: inbox.displayName,
        createdAt: inbox.createdAt,
      });

    await this.updateProgress(job, 70);

    this.logger.info("No-match scheduler completed", {
      updatedCount: result.length,
      cutoffDate: ninetyDaysAgo.toISOString(),
      sampleUpdatedItems: result.slice(0, 5).map((item) => ({
        id: item.id,
        teamId: item.teamId,
        displayName: item.displayName,
        createdAt: item.createdAt,
      })),
    });

    // Log some statistics for monitoring
    if (result.length > 0) {
      const teamCounts = result.reduce(
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

    await this.updateProgress(job, 100);

    return {
      updatedCount: result.length,
      cutoffDate: ninetyDaysAgo.toISOString(),
    };
  }
}
