import { eventTrigger } from "@trigger.dev/sdk";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { client, supabase } from "../client";
import { Events, Jobs } from "../constants";
import { engine } from "../utils/engine";
import { processBatch } from "../utils/process";
import { getClassification, transformTransaction } from "../utils/transform";

const BATCH_LIMIT = 500;

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

    const { data: accountsData } = await supabase
      .from("bank_accounts")
      .select(
        "id, team_id, account_id, type, bank_connection:bank_connection_id(id, provider, access_token, status, error_retries)",
      )
      .eq("bank_connection_id", connectionId)
      .lt("bank_connection.error_retries", 4)
      .eq("team_id", teamId)
      .eq("enabled", true)
      .eq("manual", false);

    const accountErrors = [];
    const connectionErrors = new Set();

    for (const account of accountsData || []) {
      try {
        // Get balance and update account
        const balance = await engine.accounts.balance({
          provider: account.bank_connection.provider,
          id: account.account_id,
          accessToken: account.bank_connection?.access_token,
        });

        if (balance.data?.amount) {
          await supabase
            .from("bank_accounts")
            .update({
              balance: balance.data.amount,
            })
            .eq("id", account.id);
        }

        // Get transactions
        const transactions = await engine.transactions.list({
          provider: account.bank_connection.provider,
          accountId: account.account_id,
          accountType: getClassification(account.type),
          accessToken: account.bank_connection?.access_token,
        });

        const formattedTransactions = transactions.data?.map((transaction) => {
          return transformTransaction({
            transaction,
            teamId: account.team_id,
            bankAccountId: account.id,
          });
        });

        // NOTE: We will get all the transactions at once for each account so
        // we need to guard against massive payloads
        await processBatch(
          formattedTransactions,
          BATCH_LIMIT,
          async (batch) => {
            await supabase.from("transactions").upsert(batch, {
              onConflict: "internal_id",
              ignoreDuplicates: true,
            });
          },
        );
      } catch (error) {
        accountErrors.push({
          accountId: account.id,
          error: error instanceof Error ? error.message : String(error),
        });
        connectionErrors.add(account.bank_connection.id);
      }
    }

    // Update bank connection status based on error_retries is more than 3, set to disconnected
    await supabase
      .from("bank_connections")
      .update({ status: "disconnected" })
      .eq("id", connectionId)
      .gte("error_retries", 4);

    // If is success, reset error_retries to 0 once per bank connection
    if (accountErrors.length === 0) {
      await supabase
        .from("bank_connections")
        .update({
          last_accessed: new Date().toISOString(),
          status: "connected",
          error_details: null,
          error_retries: 0,
        })
        .eq("id", connectionId);
    }

    if (accountErrors.length > 0) {
      await io.logger.error("Some accounts failed to sync", accountErrors);
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
