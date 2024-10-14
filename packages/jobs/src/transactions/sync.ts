// Import necessary modules and utilities
import Midday from "@midday-ai/engine";
import { revalidateTag } from "next/cache";
import { client, supabase } from "../client";
import { Events, Jobs } from "../constants";
import { engine } from "../utils/engine";
import { parseAPIError } from "../utils/error";
import { getClassification, transformTransaction } from "../utils/transform";
import { scheduler } from "./scheduler";

// Define a job for syncing transactions
client.defineJob({
  id: Jobs.TRANSACTIONS_SYNC,
  name: "Transactions - Sync",
  version: "0.0.1",
  trigger: scheduler,
  integrations: { supabase },
  run: async (_, io, ctx) => {
    const supabase = io.supabase.client;

    const teamId = ctx.source?.id as string;

    // Fetch enabled bank accounts for the team
    const { data: accountsData } = await supabase
      .from("bank_accounts")
      .select(
        "id, team_id, account_id, type, bank_connection:bank_connection_id(id, provider, access_token, status, error_retries)",
      )
      .eq("team_id", teamId)
      .eq("enabled", true)
      .lt("bank_connection.error_retries", 4)
      .eq("manual", false);

    // If no accounts found, log and return
    if (!accountsData || accountsData.length === 0) {
      await io.logger.info("No accounts found for sync");
      return;
    }

    // Create sync promises for each account
    const syncPromises = accountsData.map(async (account) => {
      const connectionErrors: { accountId: string; error: unknown }[] = [];

      try {
        // Get balance and update account
        const balance = await engine.accounts.balance({
          provider: account.bank_connection.provider,
          id: account.account_id,
          accessToken: account.bank_connection?.access_token,
        });

        // Update account balance if available
        if (balance.data?.amount) {
          await supabase
            .from("bank_accounts")
            .update({ balance: balance.data.amount })
            .eq("id", account.id);
        }

        // Get transactions for the account
        const transactions = await engine.transactions.list({
          provider: account.bank_connection.provider,
          accountId: account.account_id,
          accountType: getClassification(account.type),
          accessToken: account.bank_connection?.access_token,
          latest: "true",
        });

        // Format transactions
        const formattedTransactions = transactions.data?.map((transaction) =>
          transformTransaction({
            transaction,
            teamId: account.team_id,
            bankAccountId: account.id,
          }),
        );

        return { account, transactions: formattedTransactions };
      } catch (error) {
        // Handle errors and return them
        connectionErrors.push({
          accountId: account.id,
          error:
            error instanceof Midday.APIError
              ? parseAPIError(error)
              : { message: "An unexpected error occurred" },
        });
        return { account, errors: connectionErrors };
      }
    });

    try {
      // Wait for all sync promises to resolve
      const results = await Promise.all(syncPromises);
      const successfulResults = results.filter((result) => !result.errors);
      const failedResults = results.filter((result) => result.errors);

      // Process successful results
      if (successfulResults.length > 0) {
        const allTransactions = successfulResults.flatMap(
          (result) => result.transactions || [],
        );

        if (allTransactions.length > 0) {
          // Upsert transactions into the database
          const { error: transactionsError, data: transactionsData } =
            await supabase
              .from("transactions")
              .upsert(allTransactions, {
                onConflict: "internal_id",
                ignoreDuplicates: true,
              })
              .select("*");

          if (transactionsError) {
            await io.logger.error("Transactions error", transactionsError);
          } else if (transactionsData && transactionsData.length > 0) {
            // Send notifications for new transactions
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

            // Revalidate relevant tags
            revalidateTag(`transactions_${teamId}`);
            revalidateTag(`spending_${teamId}`);
            revalidateTag(`metrics_${teamId}`);
            revalidateTag(`expenses_${teamId}`);
          }
        }
      }

      // Process failed results
      if (failedResults.length > 0) {
        const failedConnectionsMap = new Map();

        for (const result of failedResults) {
          const { account, errors } = result;
          if (errors && errors.length > 0) {
            const connectionId = account.bank_connection.id;
            if (!failedConnectionsMap.has(connectionId)) {
              failedConnectionsMap.set(connectionId, {
                newErrorRetries: account.bank_connection.error_retries + 1,
                errors: [],
              });
            }

            failedConnectionsMap.get(connectionId).errors.push(...errors);

            // Log sync failure
            await io.logger.error(
              `Sync failed for account ${account.id}`,
              errors[0].error,
            );
          }
        }

        for (const [
          connectionId,
          { newErrorRetries, errors },
        ] of failedConnectionsMap) {
          const newStatus = newErrorRetries >= 3 ? "disconnected" : "connected";

          await supabase
            .from("bank_connections")
            .update({
              status: newStatus,
              error_details: errors[0].error.message,
              error_retries: newErrorRetries,
            })
            .eq("id", connectionId);
        }
      }

      // Reset error_retries for successful connections
      const successfulConnectionIds = [
        ...new Set(
          successfulResults.map((result) => result.account.bank_connection.id),
        ),
      ];
      if (successfulConnectionIds.length > 0) {
        await supabase
          .from("bank_connections")
          .update({ error_retries: 0 })
          .in("id", successfulConnectionIds);
      }

      // Revalidate bank accounts tag
      revalidateTag(`bank_accounts_${teamId}`);
    } catch (error) {
      // Log any unexpected errors
      await io.logger.debug(`Team id: ${teamId}`);
      await io.logger.error(
        error instanceof Error ? error.message : String(error),
      );
      await io.logger.error("An unexpected error occurred during sync");
    }
  },
});
