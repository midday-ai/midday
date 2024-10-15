/**
 * Manual Transaction Sync Job
 *
 * This job performs a manual synchronization of bank account transactions for a specific team and connection.
 * It is triggered by an event and executes the following steps:
 *
 * 1. Fetch enabled bank accounts for the given connection and team
 * 2. For each account:
 *    a. Fetch and format transactions
 *    b. Update account balance
 *    c. Upsert transactions in batches
 * 3. Handle sync results:
 *    a. Update failed accounts
 *    b. Update bank connection status and error retries
 * 4. Revalidate relevant cache tags
 *
 * The job uses error handling to manage sync issues for individual accounts
 * and updates the status of bank connections based on overall sync success or failure.
 */

import Midday from "@midday-ai/engine";
import { eventTrigger } from "@trigger.dev/sdk";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { client, supabase } from "../client";
import { Events, Jobs } from "../constants";
import { engine } from "../utils/engine";
import { parseAPIError } from "../utils/error";
import { processBatch } from "../utils/process";
import { getClassification, transformTransaction } from "../utils/transform";

// Maximum number of transactions to process in a single batch
const TRANSACTIONS_BATCH_LIMIT = 500;

client.defineJob({
  id: Jobs.TRANSACTIONS_MANUAL_SYNC,
  name: "Transactions - Manual Sync",
  version: "0.0.3",
  trigger: eventTrigger({
    name: Events.TRANSACTIONS_MANUAL_SYNC,
    schema: z.object({
      connectionId: z.string(),
      teamId: z.string(),
    }),
  }),
  integrations: { supabase },
  run: async (payload, io) => {
    const supabase = io.supabase.client;

    const { teamId, connectionId } = payload;

    await io.logger.info("Starting manual sync", { teamId, connectionId });

    // Fetch bank accounts associated with the connection
    const { data: bankAccounts } = await supabase
      .from("bank_accounts")
      .select(
        "id, team_id, account_id, type, bank_connection:bank_connection_id(id, provider, access_token, status, error_retries)",
      )
      .eq("bank_connection_id", connectionId)
      .lt("bank_connection.error_retries", 4)
      .eq("team_id", teamId)
      .eq("enabled", true)
      .eq("manual", false);

    await io.logger.info(`Found ${bankAccounts?.length || 0} accounts to sync`);

    let connectionHasError = false;
    let connectionErrorCode = "unknown";

    const syncPromises = bankAccounts?.map(async (account) => {
      try {
        await io.logger.info("Starting sync for account", {
          accountId: account.id,
        });

        // Fetch transactions for the account
        const fetchedTransactions = await engine.transactions.list({
          provider: account.bank_connection.provider,
          accountId: account.account_id,
          accountType: getClassification(account.type),
          accessToken: account.bank_connection?.access_token,
        });

        await io.logger.info(
          `Retrieved ${fetchedTransactions.data?.length || 0} transactions`,
          { accountId: account.id },
        );

        // Transform fetched transactions to the required format
        const formattedTransactions = fetchedTransactions.data?.map(
          (transaction) => {
            return transformTransaction({
              transaction,
              teamId: account.team_id,
              bankAccountId: account.id,
            });
          },
        );

        // Fetch account balance
        const accountBalance = await engine.accounts.balance({
          provider: account.bank_connection.provider,
          id: account.account_id,
          accessToken: account.bank_connection?.access_token,
        });

        // Update account balance if available and greater than 0
        if (accountBalance.data?.amount && accountBalance.data.amount > 0) {
          await supabase
            .from("bank_accounts")
            .update({
              balance: accountBalance.data.amount,
              error_details: null,
            })
            .eq("id", account.id);

          await io.logger.info("Updated balance for account", {
            accountId: account.id,
            balance: accountBalance.data.amount,
          });
        }

        // Process transactions in batches to avoid massive payloads
        await processBatch(
          formattedTransactions,
          TRANSACTIONS_BATCH_LIMIT,
          async (transactionBatch) => {
            await supabase.from("transactions").upsert(transactionBatch, {
              onConflict: "internal_id",
              ignoreDuplicates: true,
            });
            await io.logger.info(
              `Upserted ${transactionBatch.length} transactions`,
              {
                accountId: account.id,
              },
            );
          },
        );

        await io.logger.info("Completed sync for account", {
          accountId: account.id,
        });

        return {
          success: true,
          accountId: account.id,
        };
      } catch (syncError) {
        await io.logger.error("Error syncing account", {
          accountId: account.id,
          error: syncError,
        });

        connectionHasError = true;
        if (syncError instanceof Midday.APIError) {
          const parsedError = parseAPIError(syncError);
          connectionErrorCode = parsedError.code;
        }

        return {
          success: false,
          accountId: account.id,
          error: syncError,
        };
      }
    });

    if (syncPromises) {
      const syncResults = await Promise.all(syncPromises);
      const successfulAccounts = syncResults.filter((result) => result.success);
      const failedAccounts = syncResults.filter((result) => !result.success);

      await io.logger.info("Sync results", {
        successfulAccounts: successfulAccounts.length,
        failedAccounts: failedAccounts.length,
      });

      // Handle failed accounts
      if (failedAccounts.length > 0) {
        await io.logger.error("Some accounts failed to sync", failedAccounts);

        // Update failed accounts
        for (const failedAccount of failedAccounts) {
          await supabase
            .from("bank_accounts")
            .update({
              error_details:
                failedAccount.error instanceof Error
                  ? failedAccount.error.message
                  : String(failedAccount.error),
            })
            .eq("id", failedAccount.accountId);
        }
      }

      // Update bank connection status based on sync results
      if (
        successfulAccounts.length === 0 &&
        connectionErrorCode === "disconnected"
      ) {
        // All accounts failed, update bank connection status to disconnected
        await supabase
          .from("bank_connections")
          .update({
            status: "disconnected",
            error_retries: 4, // Set to max to prevent further retries
          })
          .eq("id", connectionId);

        await io.logger.warn(
          "All accounts failed, marked connection as disconnected",
          { connectionId },
        );
      } else {
        // At least one account succeeded, update bank connection status
        const updateData: {
          last_accessed: string;
          status: string;
          error_details: null;
          error_retries?: number;
        } = {
          last_accessed: new Date().toISOString(),
          status: "connected",
          error_details: null,
        };

        if (connectionHasError) {
          const { data } = await supabase
            .from("bank_connections")
            .select("error_retries")
            .eq("id", connectionId)
            .single();

          updateData.status = connectionErrorCode;

          if (updateData.status !== "unknown") {
            updateData.error_retries = (data?.error_retries || 0) + 1;
          }
        } else {
          updateData.error_retries = 0;
        }

        await supabase
          .from("bank_connections")
          .update(updateData)
          .eq("id", connectionId);

        await io.logger.info(
          "At least one account succeeded, updated connection status",
          { connectionId, connectionHasError, newStatus: updateData.status },
        );
      }
    }

    revalidateTag(`bank_connections_${teamId}`);
    revalidateTag(`transactions_${teamId}`);
    revalidateTag(`spending_${teamId}`);
    revalidateTag(`metrics_${teamId}`);
    revalidateTag(`bank_accounts_${teamId}`);
    revalidateTag(`insights_${teamId}`);
    revalidateTag(`expenses_${teamId}`);
  },
});
