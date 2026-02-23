import { getDb } from "@jobs/init";
import { inbox } from "@midday/db/schema";
import { logger, schedules } from "@trigger.dev/sdk";
import { subDays } from "date-fns";
import { and, eq, lt, sql } from "drizzle-orm";

export const noMatchScheduler = schedules.task({
  id: "no-match-scheduler",
  cron: "0 2 * * *",
  maxDuration: 300,
  run: async () => {
    if (process.env.TRIGGER_ENVIRONMENT !== "production") return;

    const db = getDb();

    try {
      const ninetyDaysAgo = subDays(new Date(), 90);

      logger.info("Starting no-match scheduler", {
        cutoffDate: ninetyDaysAgo.toISOString(),
      });

      const result = await db
        .update(inbox)
        .set({
          status: "no_match",
        })
        .where(
          and(
            eq(inbox.status, "pending"),
            lt(inbox.createdAt, ninetyDaysAgo.toISOString()),
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

      if (result.length > 0) {
        const teamCounts = result.reduce(
          (acc, item) => {
            const key = item.teamId ?? "unknown";
            acc[key] = (acc[key] || 0) + 1;
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
