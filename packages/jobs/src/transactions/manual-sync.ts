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

    const promises = accountsData?.map(async (account) => {
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

      const balance = await engine.accounts.balance({
        provider: account.bank_connection.provider,
        id: account.account_id,
        accessToken: account.bank_connection?.access_token,
      });

      // Update account balance
      if (balance.data?.amount) {
        await supabase
          .from("bank_accounts")
          .update({
            balance: balance.data.amount,
          })
          .eq("id", account.id);
      }

      // NOTE: We will get all the transactions at once for each account so
      // we need to guard against massive payloads
      await processBatch(formattedTransactions, BATCH_LIMIT, async (batch) => {
        await supabase.from("transactions").upsert(batch, {
          onConflict: "internal_id",
          ignoreDuplicates: true,
        });
      });
    });

    try {
      if (promises) {
        await Promise.all(promises);
      }
    } catch (error) {
      if (error instanceof Midday.APIError) {
        const parsedError = parseAPIError(error);

        await io.supabase.client
          .from("bank_connections")
          .update({
            status: parsedError.code,
            error_details: parsedError.message,
          })
          .eq("id", connectionId);
      }

      throw new Error(error instanceof Error ? error.message : String(error));
    }

    // Update bank connection last accessed and restore connection status
    await io.supabase.client
      .from("bank_connections")
      .update({
        last_accessed: new Date().toISOString(),
        status: "connected",
        error_details: null,
        error_retries: 0,
      })
      .eq("id", connectionId);

    revalidateTag(`bank_connections_${teamId}`);
    revalidateTag(`transactions_${teamId}`);
    revalidateTag(`spending_${teamId}`);
    revalidateTag(`metrics_${teamId}`);
    revalidateTag(`bank_accounts_${teamId}`);
    revalidateTag(`insights_${teamId}`);
    revalidateTag(`expenses_${teamId}`);
  },
});
