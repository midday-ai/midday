import { eventTrigger } from "@trigger.dev/sdk";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { client, supabase } from "../client";
import { Events, Jobs } from "../constants";
import { engine } from "../utils/engine";
import { processBatch } from "../utils/process";
import { getClassification, transformTransaction } from "../utils/transform";

// Maximum number of transactions to process in a single batch
const TRANSACTIONS_BATCH_LIMIT = 500;

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

        // Update account balance if available
        if (accountBalance.data?.amount) {
          await supabase
            .from("bank_accounts")
            .update({
              balance: accountBalance.data.amount,
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
              enabled: false,
              // error_details: failedAccount.error instanceof Error
              //   ? failedAccount.error.message
              //   : String(failedAccount.error),
            })
            .eq("id", failedAccount.accountId);

          await io.logger.info("Disabled failed account", {
            accountId: failedAccount.accountId,
          });
        }
      }

      // Update bank connection status based on sync results
      if (successfulAccounts.length === 0) {
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
        // At least one account succeeded, update bank connection status to connected
        await supabase
          .from("bank_connections")
          .update({
            last_accessed: new Date().toISOString(),
            status: "connected",
            error_details: null,
            error_retries: 0,
          })
          .eq("id", connectionId);

        await io.logger.info(
          "At least one account succeeded, marked connection as connected",
          { connectionId },
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
