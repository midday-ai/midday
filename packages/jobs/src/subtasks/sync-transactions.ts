import { Database } from "@midday/supabase/types";
import { IOWithIntegrations } from "@trigger.dev/sdk";
import { Supabase } from "@trigger.dev/supabase";
import { BATCH_LIMIT } from "../constants/constants";
import { BankAccountWithConnection } from "../types/bank-account-with-connection";
import { engine } from "../utils/engine";
import { uniqueLog } from "../utils/log";
import { processBatch } from "../utils/process";
import { getClassification, transformTransaction } from "../utils/transform";
import { updateBankConnectionStatus } from "./update-bank-connection-status";

/**
 * Synchronizes transactions for multiple bank accounts.
 *
 * This function performs the following operations for each bank account:
 * 1. Fetches transactions from the banking provider
 * 2. Transforms the transactions into a format suitable for storage
 * 3. Fetches and updates the account balance
 * 4. Upserts the transformed transactions into the database
 *
 * @param io - An object containing integration clients, including Supabase
 * @param accountsData - An array of bank accounts with their connection details
 * @param taskKeyPrefix - A prefix used to generate unique task keys
 *
 * @returns A promise that resolves to an object indicating the success of the operation
 *
 * @throws Will throw an error if there are issues with fetching transactions,
 *         updating account balances, or upserting transactions
 *
 * @example
 * const result = await syncTransactionsSubTask(io, accountsData, 'daily');
 * if (result.success) {
 *   console.log('Transactions synchronized successfully');
 * }
 */
async function syncTransactionsSubTask(
  io: IOWithIntegrations<{
    supabase: Supabase<Database, "public", any>;
  }>,
  accountsData: Array<BankAccountWithConnection> | null,
  taskKeyPrefix: string
): Promise<{ success: boolean }> {
  const supabase = io.supabase.client;

  const response = await io.runTask(
    `${taskKeyPrefix.toLocaleLowerCase()}-sync-transactions-subtask-${Date.now()}`,
    async () => {
      const promises = accountsData?.map(async (account) => {
        await uniqueLog(
          io,
          "info", `Processing account: ${account.id}`);
        await uniqueLog(
          io,
          "info", `Account type: ${account.type}`);

        const accountType = getClassification(account.type);
        await uniqueLog(
          io,
          "info", `Classified account type: ${accountType}`);

        // Fetch transactions for the account
        await uniqueLog(
          io,
          "info", `Fetching transactions for account ${account.id}`);
        const transactions = await engine.transactions.list({
          provider: account.bank_connection.provider,
          accountId: account.account_id,
          accountType: accountType as
            | "depository"
            | "credit"
            | "other_asset"
            | "loan"
            | "other_liability"
            | undefined,
          accessToken: account.bank_connection?.access_token,
          latest: "true",
        });
        await uniqueLog(
          io,
          "info",
          `Retrieved ${transactions.data?.length || 0} transactions for account ${account.id} (Type: ${accountType})`
        );

        // Transform transactions
        await uniqueLog(
          io,
          "info", `Transforming transactions for account ${account.id}`);
        const formattedTransactions = transactions.data?.map((transaction) => {
          return transformTransaction({
            transaction,
            teamId: account.team_id,
            bankAccountId: account.id,
          });
        });
        await uniqueLog(
          io,
          "info",
          `Transformed ${formattedTransactions?.length || 0} transactions`
        );

        // Fetch and update account balance
        await uniqueLog(
          io,
          "info", `Fetching balance for account ${account.id}`);
        const balance = await engine.accounts.balance({
          provider: account.bank_connection.provider,
          id: account.account_id,
          accessToken: account.bank_connection?.access_token,
        });
        await uniqueLog(
          io,
          "info",
          `Retrieved balance for account ${account.id}: ${balance.data?.amount}`
        );

        if (balance.data?.amount) {
          await uniqueLog(
            io,
            "info", `Updating balance for account ${account.id}`);
          await supabase
            .from("bank_accounts")
            .update({
              balance: balance.data.amount,
            })
            .eq("id", account.id);
          await uniqueLog(
            io,
            "info", `Balance updated for account ${account.id}`);

          // Update bank connection status to connected
          await updateBankConnectionStatus(
            io,
            account.bank_connection?.id,
            "connected",
            taskKeyPrefix,
            null
          );
        }

        // Process transactions in batches
        await uniqueLog(
          io,
          "info",
          `Processing transactions in batches for account ${account.id}`
        );
        await processBatch(
          formattedTransactions,
          BATCH_LIMIT,
          async (batch) => {
            await uniqueLog(
              io,
              "info",
              `Processing batch of ${batch.length} transactions for account ${account.id}`
            );
            const { data, error } = await supabase
              .from("transactions")
              .upsert(batch as any, {
                onConflict: "internal_id",
                ignoreDuplicates: true,
              });
            if (error) {
              console.error(
                `Error upserting transactions for account ${account.id}:`,
                error
              );
            } else {
              await uniqueLog(
                io,
                "info",
                `Successfully upserted ${batch?.length || 0} transactions for account ${account.id}`
              );
            }
            return batch;
          }
        );
        await uniqueLog(
          io,
          "info",
          `Finished processing all batches for account ${account.id}`
        );
      });

      if (promises) {
        await uniqueLog(
          io,
          "info", "Waiting for all account processing to complete");
        await Promise.all(promises);
        await uniqueLog(
          io,
          "info", "All accounts processed successfully");
      }

      // TODO: based on the sync event call the backend and sync the transactions for the backend

      return {
        success: true,
      };
    },
    { name: "Sync Transactions Sub Task" }
  );

  return response;
}

export { syncTransactionsSubTask };
