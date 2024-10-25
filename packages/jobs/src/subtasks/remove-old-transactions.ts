import { Database } from "@midday/supabase/types";
import { IOWithIntegrations } from "@trigger.dev/sdk";
import { Supabase } from "@trigger.dev/supabase";
import { format } from "date-fns";
import { BATCH_LIMIT } from "../constants/constants";

/**
 * Removes transactions older than the specified date for a given team.
 *
 * @param io - The Trigger.dev IO context for database operations.
 * @param teamId - The ID of the team whose transactions are being processed.
 * @param cutoffDate - The date before which transactions should be removed.
 * @param taskKeyPrefix - A prefix for the task key.
 * @returns The number of transactions removed.
 */
async function removeOldTransactionsSubTask(
  io: IOWithIntegrations<{ supabase: Supabase<Database, "public", any> }>,
  teamId: string,
  cutoffDate: Date,
  taskKeyPrefix: string,
): Promise<number> {
  return io.runTask(
    `${taskKeyPrefix}-remove-old-transactions`,
    async () => {
      let totalRemoved = 0;
      let hasMore = true;

      while (hasMore) {
        const transactionIds = await fetchOldTransactionIds(teamId, cutoffDate);

        if (transactionIds.length === 0) {
          break;
        }

        const removedCount = await deleteTransactions(transactionIds);
        totalRemoved += removedCount;

        hasMore = transactionIds.length === BATCH_LIMIT;
      }

      return totalRemoved;
    },
    { name: "Remove Old Transactions" },
  );

  async function fetchOldTransactionIds(
    teamId: string,
    cutoffDate: Date,
  ): Promise<string[]> {
    const { data: transactions, error } = await io.supabase.client
      .from("transactions")
      .select("id")
      .eq("team_id", teamId)
      .lt("date", format(cutoffDate, "yyyy-MM-dd"))
      .order("date", { ascending: true })
      .limit(BATCH_LIMIT);

    if (error) {
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }

    return transactions.map((t) => t.id);
  }

  async function deleteTransactions(transactionIds: string[]): Promise<number> {
    const { error: deleteError, count } = await io.supabase.client
      .from("transactions")
      .delete()
      .in("id", transactionIds)
      .select("count");

    if (deleteError) {
      throw new Error(`Failed to delete transactions: ${deleteError.message}`);
    }

    return count || 0;
  }
}

export { removeOldTransactionsSubTask };
