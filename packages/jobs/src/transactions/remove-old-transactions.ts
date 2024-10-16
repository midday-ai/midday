import { Database, TeamSchema as Team } from "@midday/supabase/types";
import { cronTrigger, IOWithIntegrations } from "@trigger.dev/sdk";
import { Supabase } from "@trigger.dev/supabase";
import { format, subYears } from "date-fns";
import { client, supabase } from "../client";
import { Jobs } from "../constants";
import { TEAMS_PAGE_SIZE } from "../constants/constants";
import { removeOldTransactionsSubTask } from "../subtasks/remove-old-transactions";

/**
 * Fetches teams in batches using pagination.
 *
 * @param io - The Trigger.dev IO context for database operations.
 * @yields An array of teams for each page.
 */
async function* fetchTeamsBatches(
  io: IOWithIntegrations<{
    supabase: Supabase<Database, "public", any>;
  }>
): AsyncGenerator<Team[], void, unknown> {
  let lastId: string | null = null;
  let hasMore = true;

  while (hasMore) {
    let query = io.supabase.client
      .from("teams")
      .select("id")
      .order("id", { ascending: true })
      .limit(TEAMS_PAGE_SIZE);

    if (lastId) {
      query = query.gt("id", lastId);
    }

    const { data: teams, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch teams: ${error.message}`);
    }

    if (teams.length === 0) {
      hasMore = false;
    } else {
      yield teams as Team[];
      lastId = teams[teams.length - 1]?.id ?? null;
    }
  }
}

/**
 * Defines a job to remove transactions older than 1 year for all teams.
 *
 * This job is scheduled to run monthly and performs the following steps:
 * 1. Calculates the cutoff date (1 year ago from the current date).
 * 2. Retrieves all teams from the database in batches.
 * 3. For each team, removes transactions older than the cutoff date in batches.
 * 4. Returns a summary of the number of transactions removed for each team.
 *
 * @remarks
 * This job uses the Trigger.dev framework for job definition and execution.
 * It integrates with Supabase for data retrieval and deletion.
 * The job is designed to handle large numbers of transactions and teams efficiently by processing them in batches.
 *
 * @example
 * This job is triggered automatically by the cron schedule. To manually trigger it, you can use:
 *
 * ```typescript
 * import { client } from "@/path/to/trigger-client";
 * import { Jobs } from "@/path/to/constants";
 *
 * const triggerRemoveOldTransactions = async () => {
 *   await client.runJob({
 *     id: Jobs.REMOVE_OLD_TRANSACTIONS,
 *   });
 *
 *   console.log("Remove old transactions job triggered");
 * };
 *
 * triggerRemoveOldTransactions();
 * ```
 */
client.defineJob({
  id: Jobs.REMOVE_OLD_TRANSACTIONS,
  name: "Transactions - Remove Old",
  version: "0.0.1",
  trigger: cronTrigger({
    cron: "0 0 1 * *", // Run at 00:00 on the first day of every month
  }),
  integrations: { supabase },
  run: async (payload, io) => {
    const cutoffDate = subYears(new Date(), 1);
    const results: { [teamId: string]: number } = {};
    let totalRemoved = 0;
    let processedTeams = 0;

    for await (const teamsBatch of fetchTeamsBatches(io)) {
      for (const team of teamsBatch) {
        const prefix = `remove-old-txns-${team.id}-${Date.now()}`;
        const removedCount = await removeOldTransactionsSubTask(
          io,
          team.id,
          cutoffDate,
          prefix
        );
        results[team.id] = removedCount;
        totalRemoved += removedCount;
        processedTeams++;

        // Log progress every 100 teams
        if (processedTeams % 100 === 0) {
          io.logger.info(
            `Processed ${processedTeams} teams. Total removed: ${totalRemoved}`
          );
        }
      }
    }

    return {
      message: "Old transactions removal completed successfully",
      cutoffDate: format(cutoffDate, "yyyy-MM-dd"),
      totalRemoved,
      processedTeams,
      teamResults: results,
    };
  },
});
