import { ConnectionStatus } from "@midday/supabase/types";
import FinancialEngine from "@solomon-ai/financial-engine-sdk";
import { eventTrigger } from "@trigger.dev/sdk";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { client, supabase } from "../client";
import { Events, Jobs } from "../constants";
import { fetchEnabledBankAccountsSubTask } from "../subtasks/fetch-enabled-bank-account";
import { syncTransactionsSubTask } from "../subtasks/sync-transactions";
import { updateBankConnectionStatus } from "../subtasks/update-bank-connection-status";
import { parseAPIError } from "../utils/error";
import { uniqueLog } from "../utils/log";

client.defineJob({
  id: Jobs.TRANSACTIONS_MANUAL_SYNC,
  name: "Transactions - Manual Sync",
  version: "0.0.1",
  trigger: eventTrigger({
    name: Events.TRANSACTIONS_MANUAL_SYNC,
    schema: z.object({
      connectionId: z.string(),
      teamId: z.string(),
    }),
  }),
  integrations: { supabase },
  /**
   * Performs a manual synchronization of transactions for a given team and connection.
   *
   * @param payload - The job payload containing teamId and connectionId.
   * @param io - The I/O object providing access to integrations like Supabase.
   *
   * This function does the following:
   * 1. Retrieves enabled bank accounts for the given team and connection.
   * 2. For each account:
   *    - Fetches the latest transactions
   *    - Retrieves and updates the account balance
   *    - Processes and upserts transactions in batches
   * 3. Handles any errors during processing
   * 4. Updates the bank connection status
   * 5. Revalidates various data tags
   *
   * @throws {Error} If any error occurs during processing
   */
  run: async (payload, io) => {
    io.logger.log("Starting manual sync job");
    const supabase = io.supabase.client;

    const { teamId, connectionId } = payload;
    await uniqueLog(
      io,
      "info",
      `Processing for teamId: ${teamId}, connectionId: ${connectionId}`
    );

    // Fetch enabled bank accounts
    await uniqueLog(
      io,
      "info",
      "Fetching enabled bank accounts");
    const prefix = `manual-sync-${teamId}-${connectionId}`;

    // Fetch enabled bank accounts for the team
    const accountsData = await fetchEnabledBankAccountsSubTask(
      io,
      teamId,
      connectionId,
      `${prefix}-fetch-enabled-bank-accounts`
    );

    await uniqueLog(
      io,
      "info", 
      `Found ${accountsData?.length || 0} enabled bank accounts`);

    try {
      // execute the sync transactions subtask for the accounts enabled for the team
      await syncTransactionsSubTask(io, accountsData, `${prefix}-sync-transactions`);
    } catch (error) {
      console.error("Error occurred during processing:", error);
      if (error instanceof FinancialEngine.APIError) {
        const parsedError = parseAPIError(error);
        await uniqueLog(
          io,
          "error", 
          "Parsed API error:", parsedError);

        // Function to check if a status is allowed
        const isAllowedStatus = (
          status: string
        ): status is ConnectionStatus => {
          return (
            ["disconnected", "connected", "unknown"].includes(status) ||
            status === null ||
            status === undefined
          );
        };

        // Determine the status to use
        const status: ConnectionStatus = isAllowedStatus(parsedError.code)
          ? parsedError.code
          : "unknown";

        await uniqueLog(
          io,
          "info", 
          `Updating bank connection status to ${status}`);
        await updateBankConnectionStatus(
          io,
          connectionId,
          status,
          prefix,
          parsedError.message
        );

        await uniqueLog(
          io,
          "info", 
          "Bank connection status updated due to error");
      }

      throw new Error(error instanceof Error ? error.message : String(error));
    }

    // Update bank connection status
    await uniqueLog(
      io,
      "info", 
      "Updating bank connection status to 'connected'");
    await updateBankConnectionStatus(
      io,
      connectionId,
      "connected",
      prefix,
      null
    );
    await uniqueLog(
      io,
      "info", 
      "Bank connection status updated successfully");

    // Revalidate data tags
    console.log("Revalidating tags");
    const tagsToRevalidate = [
      `bank_connections_${teamId}`,
      `transactions_${teamId}`,
      `spending_${teamId}`,
      `metrics_${teamId}`,
      `bank_accounts_${teamId}`,
      `insights_${teamId}`,
      `expenses_${teamId}`,
    ];
    tagsToRevalidate.forEach((tag) => {
      revalidateTag(tag);
    });
    await uniqueLog(
      io,
      "info", 
      "All tags revalidated. Manual sync job completed successfully");

  },
});
