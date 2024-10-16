import FinancialEngine from "@solomon-ai/financial-engine-sdk";
import { revalidateTag } from "next/cache";
import { client, supabase } from "../client";
import { Jobs } from "../constants";
import { BATCH_LIMIT } from "../constants/constants";
import { fetchEnabledBankAccountsForTeamSubTask } from "../subtasks/fetch-enabled-bank-account";
import { engine } from "../utils/engine";
import { parseAPIError } from "../utils/error";
import { uniqueLog } from "../utils/log";
import { processBatch } from "../utils/process";
import { sleep } from "../utils/sleep";
import { getClassification, transformTransaction } from "../utils/transform";
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
    await uniqueLog(io, "info", "Starting TRANSACTIONS_SYNC job");
    const supabase = io.supabase.client;
    const teamId = ctx.source?.id as string;
    await uniqueLog(io, "info", `Processing for team ID: ${teamId}`);
    const prefix = `team-txn-sync-${teamId}-${Date.now()}`;

    // 1. Fetch enabled bank accounts for the team
    await uniqueLog(io, "info", "Fetching enabled bank accounts");
    const accountsData = await fetchEnabledBankAccountsForTeamSubTask(
      io,
      teamId,
      "transactions-sync",
      { excludeManual: true }
    );

    await uniqueLog(
      io,
      "info",
      `Found ${accountsData?.length || 0} enabled bank accounts`
    );

    try {
      // execute the sync transactions subtask for the accounts enabled for the team
      // await syncTransactionsSubTask(io, accountsData, prefix);
      /**
       * Processes transactions for each bank account.
       *
       * @param account - The bank account information
       */
      const promises = accountsData?.map(async (account) => {
        let transactionSyncCursor = "";

        await io.logger.debug(
          `Processing account: ${account.id} for team: ${teamId}`
        );
        try {
          /**
           * Fetches transactions from the financial engine with retry logic.
           *
           * @param retries - The number of retry attempts
           * @returns A promise resolving to the transactions data
           */
          const getTransactions = async (
            retries = 0
          ): Promise<FinancialEngine.TransactionsSchema> => {
            try {
              return await engine.transactions.list({
                provider: account.bank_connection.provider,
                accountId: account.account_id,
                accountType: getClassification(account.type) as any,
                accessToken: account.bank_connection?.access_token,
                latest: "true",
                syncCursor: account.bank_connection?.last_cursor_sync,
              });
            } catch (error) {
              if (
                (error instanceof FinancialEngine.APIError &&
                  error.status === 429 &&
                  retries < 5) ||
                (error instanceof FinancialEngine.APIError &&
                  error.message.includes("rate limit") &&
                  retries < 5)
              ) {
                const delay = Math.pow(2, retries) * 1000; // Exponential backoff
                await io.logger.warn(`Rate limited, retrying in ${delay}ms`, {
                  retries,
                });
                await sleep(delay);
                return getTransactions(retries + 1);
              }
              throw error;
            }
          };

          const { data: transactions, cursor, hasMore } =
            await getTransactions();

          transactionSyncCursor = cursor ?? "";

          await io.logger.info(
            `Retrieved ${transactions?.length} transactions for account: ${account.id}`
          );

          const formattedTransactions = transactions?.map((transaction) =>
            transformTransaction({
              transaction,
              teamId: account.team_id,
              bankAccountId: account.id,
            })
          );
          await io.logger.debug(
            `Formatted ${formattedTransactions?.length} transactions for account: ${account.id}`
          );

          /**
           * Processes transactions in batches and upserts them to the database.
           */
          await processBatch(
            formattedTransactions,
            BATCH_LIMIT,
            async (batch) => {
              await io.logger.debug(
                `Upserting batch of ${batch.length} transactions for account: ${account.id}`
              );
              const { data, error } = await supabase
                .from("transactions")
                .upsert(batch as any, {
                  onConflict: "internal_id",
                  ignoreDuplicates: true,
                });

              if (error) {
                await io.logger.error(
                  `Error upserting transactions for account: ${account.id}`,
                  { error }
                );
              }

              await io.logger.debug(
                `Upserted batch ${data} for account: ${account.id}`
              );
              return batch;
            }
          );
        } catch (error) {
          await io.logger.error(
            `Error processing transactions for account: ${account.id}`,
            { error }
          );
          if (error instanceof FinancialEngine.APIError) {
            const parsedError = parseAPIError(error);
            await io.logger.warn(`API Error for account: ${account.id}`, {
              parsedError,
            });
            await io.supabase.client
              .from("bank_connections")
              .update({
                status: parsedError.code as
                  | "disconnected"
                  | "connected"
                  | "unknown"
                  | null
                  | undefined,
                error_details: parsedError.message,
              })
              .eq("id", account.bank_connection.id);
            await io.logger.info(
              `Updated bank connection status for account: ${account.id}`
            );
          }
        }

        /**
         * Updates the account balance and last accessed time.
         */
        try {
          const balance = await engine.accounts.balance({
            provider: account.bank_connection.provider,
            id: account.account_id,
            accessToken: account.bank_connection?.access_token,
          });
          await io.logger.debug(`Retrieved balance for account: ${account.id}`, {
            balance: balance.data?.amount,
          });

          if (balance.data?.amount) {
            await io.supabase.client
              .from("bank_accounts")
              .update({ balance: balance.data.amount })
              .eq("id", account.id);
            await io.logger.info(`Updated balance for account: ${account.id}`);
          }

          await io.supabase.client
            .from("bank_connections")
            .update({
              last_accessed: new Date().toISOString(),
              last_cursor_sync: transactionSyncCursor,
            })
            .eq("id", account.bank_connection.id);
          await io.logger.debug(
            `Updated last_accessed for bank connection: ${account.bank_connection.id}`
          );
        } catch (error) {
          await io.logger.error(
            `Error updating balance or last_accessed for account: ${account.id
            } ${JSON.stringify(error)}`,
            { error }
          );
        }
      });

      /**
       * Waits for all account processing to complete.
       */
      try {
        if (promises) {
          await Promise.all(promises);
          await io.logger.info(
            `Completed processing all accounts for team: ${teamId}`
          );
        }
      } catch (error) {
        await io.logger.error(`Error processing accounts for team: ${teamId}`, {
          error,
        });
      }
    } catch (error) {
      console.error("Error occurred during processing:", error);
      throw new Error(error instanceof Error ? error.message : String(error));
    }

    await uniqueLog(io, "info", "TRANSACTIONS_SYNC job completed");

    console.log("Revalidating cache tags");
    revalidateTag(`transactions_${teamId}`);
    revalidateTag(`spending_${teamId}`);
    revalidateTag(`metrics_${teamId}`);
    revalidateTag(`expenses_${teamId}`);
  },
});