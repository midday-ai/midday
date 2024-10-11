import { revalidateTag } from "next/cache";
import { client, supabase } from "../client";
import { Jobs } from "../constants";
import { fetchEnabledBankAccountsForTeamSubTask } from "../subtasks/fetch-enabled-bank-account";
import { syncTransactionsSubTask } from "../subtasks/sync-transactions";
import { uniqueLog } from "../utils/log";
import { scheduler } from "./scheduler";

client.defineJob({
  id: Jobs.TRANSACTIONS_SYNC,
  name: "Transactions - Sync",
  version: "0.0.1",
  trigger: scheduler,
  integrations: { supabase },
  /**
   * Synchronizes transactions for all enabled bank accounts of a team.
   *
   * @param _ - Unused parameter
   * @param io - Input/Output object for accessing Supabase client and logging
   * @param ctx - Context object containing the team ID
   *
   * Execution flow:
   * 1. Fetch enabled bank accounts for the team
   * 2. For each account:
   *    a. Update account balance
   *    b. Update bank connection last accessed timestamp
   *    c. Fetch and format new transactions
   * 3. Upsert all new transactions into the database
   * 4. Send notifications for new transactions
   * 5. Revalidate relevant cache tags
   */
  run: async (_, io, ctx) => {
    await uniqueLog(
      io,
      "info", "Starting TRANSACTIONS_SYNC job");
    const supabase = io.supabase.client;
    const teamId = ctx.source?.id as string;
    await uniqueLog(
      io,
      "info", `Processing for team ID: ${teamId}`);
    const prefix = `team-txn-sync-${teamId}-${Date.now()}`;

    // 1. Fetch enabled bank accounts for the team
    await uniqueLog(
      io,
      "info", "Fetching enabled bank accounts");
    const accountsData = await fetchEnabledBankAccountsForTeamSubTask(
      io,
      teamId,
      "transactions-sync",
      { excludeManual: true }
    );

    await uniqueLog(
      io,
      "info", `Found ${accountsData?.length || 0} enabled bank accounts`);

    try {
      // execute the sync transactions subtask for the accounts enabled for the team
      await syncTransactionsSubTask(io, accountsData, prefix);
    } catch (error) {
      console.error("Error occurred during processing:", error);
      throw new Error(error instanceof Error ? error.message : String(error));
    }

    await uniqueLog(
      io,
      "info", "TRANSACTIONS_SYNC job completed");

    console.log("Revalidating cache tags");
    revalidateTag(`transactions_${teamId}`);
    revalidateTag(`spending_${teamId}`);
    revalidateTag(`metrics_${teamId}`);
    revalidateTag(`expenses_${teamId}`);
  },
});
