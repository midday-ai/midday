import { getDb } from "@jobs/init";
import { generateCronTag } from "@jobs/utils/generate-cron-tag";
import { getTeamsWithBankConnections } from "@midday/db/queries";
import { logger, schedules } from "@trigger.dev/sdk";
import { bankSyncScheduler } from "./bank-scheduler";

async function getRegisteredTeamIds(): Promise<Set<string>> {
  const registeredIds = new Set<string>();
  let page = 1;
  let totalPages = 1;

  do {
    const result = await schedules.list({ page, perPage: 200 });
    if (!result?.data) break;

    for (const schedule of result.data) {
      if (
        schedule.task === bankSyncScheduler.id &&
        schedule.externalId &&
        schedule.active
      ) {
        registeredIds.add(schedule.externalId);
      }
    }

    totalPages = result.pagination?.totalPages ?? 1;
    page++;
  } while (page <= totalPages);

  return registeredIds;
}

// Daily verification job that ensures every eligible team (pro/starter/active trial
// with at least one bank connection) has a registered bank-sync-scheduler.
// Compares eligible teams against existing schedules and only creates missing ones.
export const ensureBankSchedulers = schedules.task({
  id: "ensure-bank-schedulers",
  cron: "0 3 * * *",
  maxDuration: 300,
  run: async () => {
    if (process.env.TRIGGER_ENVIRONMENT !== "production") return;

    const db = getDb();

    try {
      const [eligibleTeams, registeredTeamIds] = await Promise.all([
        getTeamsWithBankConnections(db),
        getRegisteredTeamIds(),
      ]);

      const missingTeams = eligibleTeams.filter(
        (team) => !registeredTeamIds.has(team.id),
      );

      logger.info("Bank scheduler verification", {
        eligible: eligibleTeams.length,
        registered: registeredTeamIds.size,
        missing: missingTeams.length,
      });

      if (missingTeams.length === 0) return;

      let created = 0;
      let failed = 0;

      for (const team of missingTeams) {
        try {
          await schedules.create({
            task: bankSyncScheduler.id,
            cron: generateCronTag(team.id),
            timezone: "UTC",
            externalId: team.id,
            deduplicationKey: `${team.id}-${bankSyncScheduler.id}`,
          });
          created++;
        } catch (error) {
          failed++;
          logger.error("Failed to create scheduler for team", {
            teamId: team.id,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      logger.info("Bank scheduler verification complete", {
        created,
        failed,
      });
    } catch (error) {
      logger.error("Failed to run ensure-bank-schedulers", {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });

      throw error;
    }
  },
});
