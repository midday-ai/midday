import Midday from "@midday-ai/engine";
import { revalidateTag } from "next/cache";
import { client, supabase } from "../client";
import { Events, Jobs } from "../constants";
import { engine } from "../utils/engine";
import { parseAPIError } from "../utils/error";
import { getClassification, transformTransaction } from "../utils/transform";
import { scheduler } from "./scheduler";

client.defineJob({
  id: Jobs.TRANSACTIONS_SYNC,
  name: "Transactions - Sync",
  version: "0.0.1",
  trigger: scheduler,
  integrations: { supabase },
  run: async (_, io, ctx) => {
    const supabase = io.supabase.client;

    const teamId = ctx.source?.id as string;
    await io.logger.info(`Starting transaction sync for team ${teamId}`);

    const { data: accountsData, error: accountsError } = await supabase
      .from("bank_accounts")
      .select(
        "id, team_id, account_id, type, bank_connection:bank_connection_id(id, provider, access_token, status, error_retries)",
      )
      .eq("team_id", teamId)
      .eq("enabled", true)
      .lt("bank_connection.error_retries", 4)
      .eq("manual", false);

    if (accountsError) {
      await io.logger.error("Accounts Error", accountsError);
    } else {
      await io.logger.info(
        `Found ${accountsData?.length || 0} accounts to sync`,
      );
    }

    const connectionResults = new Map();

    const promises = accountsData?.map(async (account) => {
      try {
        await io.logger.info(`Processing account ${account.id}`);

        const balance = await engine.accounts.balance({
          provider: account.bank_connection.provider,
          id: account.account_id,
          accessToken: account.bank_connection?.access_token,
        });

        // Update account balance only if amount is more than 0
        if (balance.data?.amount && balance.data.amount > 0) {
          await io.supabase.client
            .from("bank_accounts")
            .update({ balance: balance.data.amount })
            .eq("id", account.id);

          await io.logger.info(`Updated balance for account ${account.id}`);
        }

        // Mark this account as successful for its connection
        if (!connectionResults.has(account.bank_connection.id)) {
          connectionResults.set(account.bank_connection.id, { success: true });
        }

        const transactions = await engine.transactions.list({
          provider: account.bank_connection.provider,
          accountId: account.account_id,
          accountType: getClassification(account.type),
          accessToken: account.bank_connection?.access_token,
          latest: "true",
        });

        await io.logger.info(
          `Retrieved ${transactions.data?.length || 0} transactions for account ${account.id}`,
        );

        const formattedTransactions = transactions.data?.map((transaction) => {
          return transformTransaction({
            transaction,
            teamId: account.team_id,
            bankAccountId: account.id,
          });
        });

        return formattedTransactions;
      } catch (error) {
        // Mark this account as failed for its connection
        if (!connectionResults.has(account.bank_connection.id)) {
          connectionResults.set(account.bank_connection.id, { success: false });
        }

        let errorDetails = "Unknown error occurred";
        if (error instanceof Midday.APIError) {
          const parsedError = parseAPIError(error);
          errorDetails = parsedError.message;
        } else if (error instanceof Error) {
          errorDetails = error.message;
        }

        await io.logger.error(
          `Error processing account ${account.id}: ${errorDetails}`,
        );

        // Return error for this account
        return {
          accountId: account.id,
          error: errorDetails,
        };
      }
    });

    try {
      if (promises) {
        const results = await Promise.allSettled(promises);
        const transactions = results
          .filter(
            (result): result is PromiseFulfilledResult<any[]> =>
              result.status === "fulfilled" && Array.isArray(result.value),
          )
          .flatMap((result) => result.value);

        const errors = results
          .filter(
            (
              result,
            ): result is PromiseFulfilledResult<{
              accountId: string;
              error: string;
            }> => result.status === "fulfilled" && "error" in result.value,
          )
          .map((result) => result.value);

        await io.logger.info(
          `Processing results: ${transactions.length} transactions, ${errors.length} errors`,
        );

        // Update bank connections based on results
        for (const [connectionId, result] of connectionResults) {
          if (result.success) {
            await io.supabase.client
              .from("bank_connections")
              .update({
                last_accessed: new Date().toISOString(),
                status: "connected",
                error_retries: 0,
              })
              .eq("id", connectionId);

            await io.logger.info(
              `Updated bank connection ${connectionId} as successful`,
            );
          } else {
            const { data: connection } = await io.supabase.client
              .from("bank_connections")
              .select("error_retries")
              .eq("id", connectionId)
              .single();

            const newErrorRetries = (connection?.error_retries || 0) + 1;
            const newStatus = newErrorRetries > 3 ? "disconnected" : "unknown";

            await io.supabase.client
              .from("bank_connections")
              .update({
                status: newStatus,
                error_retries: newErrorRetries,
              })
              .eq("id", connectionId);

            await io.logger.warn(
              `Updated bank connection ${connectionId} with error retry ${newErrorRetries}`,
            );
          }
        }

        // Update accounts with errors
        for (const error of errors) {
          await io.supabase.client
            .from("bank_accounts")
            .update({
              enabled: false,
              error_details: error.error,
            })
            .eq("id", error.accountId);

          await io.logger.warn(
            `Disabled account ${error.accountId} due to error: ${error.error}`,
          );
        }

        if (!transactions?.length) {
          await io.logger.info("No transactions to process");
          return null;
        }

        const { error: transactionsError, data: transactionsData } =
          await supabase
            .from("transactions")
            .upsert(transactions, {
              onConflict: "internal_id",
              ignoreDuplicates: true,
            })
            .select("*");

        if (transactionsError) {
          await io.logger.error("Transactions error", transactionsError);
        } else {
          await io.logger.info(
            `Upserted ${transactionsData?.length || 0} transactions`,
          );
        }

        if (transactionsData && transactionsData?.length > 0) {
          await io.sendEvent("🔔 Send notifications", {
            name: Events.TRANSACTIONS_NOTIFICATION,
            payload: {
              teamId,
              transactions: transactionsData.map((transaction) => ({
                id: transaction.id,
                date: transaction.date,
                amount: transaction.amount,
                name: transaction.name,
                currency: transaction.currency,
                category: transaction.category_slug,
                status: transaction.status,
              })),
            },
          });
          revalidateTag(`transactions_${teamId}`);
          revalidateTag(`spending_${teamId}`);
          revalidateTag(`metrics_${teamId}`);
          revalidateTag(`expenses_${teamId}`);
        }

        revalidateTag(`bank_accounts_${teamId}`);
      }
    } catch (error) {
      await io.logger.error(
        error instanceof Error ? error.message : String(error),
      );
    }
  },
});
