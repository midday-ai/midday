import { getDb } from "@jobs/init";
import { inbox } from "@midday/db/schema";
import { logger, schedules } from "@trigger.dev/sdk";
import { subDays } from "date-fns";
import { and, eq, lt, sql } from "drizzle-orm";

/**
 * Scheduled task that runs daily to update inbox items to "no_match" status
 * after they have been pending for 90 days without finding a matching transaction.
 *
 * This provides closure to users and keeps the system clean by marking items
 * that are unlikely to ever find matches due to the age of the data.
 */
export const noMatchScheduler = schedules.task({
  id: "no-match-scheduler",
  // Run daily at 2 AM UTC to avoid peak hours
  cron: "0 2 * * *",
  maxDuration: 300, // 5 minutes should be enough
  run: async () => {
    // Only run in production (Set in Trigger.dev)
    if (process.env.TRIGGER_ENVIRONMENT !== "production") return;

    const db = getDb();

    try {
      // Calculate the date 90 days ago using date-fns
      const ninetyDaysAgo = subDays(new Date(), 90);

      logger.info("Starting no-match scheduler", {
        cutoffDate: ninetyDaysAgo.toISOString(),
      });

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

      logger.info("No-match scheduler completed", {
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

        logger.info("No-match scheduler team breakdown", {
          teamCounts,
          totalTeams: Object.keys(teamCounts).length,
        });
      }
    } catch (error) {
      logger.error("Failed to run no-match scheduler", {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });

      throw error;
    }
  },
});
