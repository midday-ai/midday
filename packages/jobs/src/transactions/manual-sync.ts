import { processPromisesBatch } from "@/utils/process";
import { Provider } from "@midday/providers";
import { eventTrigger } from "@trigger.dev/sdk";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { client, supabase } from "../client";
import { Events, Jobs } from "../constants";

const BATCH_LIMIT = 300;

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
    const supabase = await io.supabase.client;

    const { teamId, connectionId } = payload;

    const { data: accountsData } = await supabase
      .from("bank_accounts")
      .select(
        "id, team_id, account_id, type, bank_connection:bank_connection_id(id, provider, access_token)",
      )
      .eq("bank_connection_id", connectionId)
      .eq("team_id", teamId)
      .eq("enabled", true);

    const promises = accountsData?.map(async (account) => {
      const provider = new Provider({
        provider: account.bank_connection.provider,
      });

      const transactions = await provider.getTransactions({
        teamId: account.team_id,
        accountId: account.account_id,
        accessToken: account.bank_connection?.access_token,
        bankAccountId: account.id,
        accountType: account.type,
      });

      const balance = await provider.getAccountBalance({
        accountId: account.account_id,
        accessToken: account.bank_connection?.access_token,
      });

      // Update account balance
      if (balance?.amount) {
        await supabase
          .from("bank_accounts")
          .update({
            balance: balance.amount,
          })
          .eq("id", account.id);
      }

      // NOTE: We will get all the transactions at once for each account so
      // we need to guard against massive payloads
      await processPromisesBatch(transactions, BATCH_LIMIT, async (batch) => {
        const formatted = batch.map(({ category, ...rest }) => ({
          ...rest,
          category_slug: category,
        }));

        await supabase.from("transactions").upsert(formatted, {
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
      await io.logger.error(error);
      throw Error("Something went wrong");
    }

    // Update bank connection last accessed
    await io.supabase.client
      .from("bank_connections")
      .update({ last_accessed: new Date().toISOString() })
      .eq("id", connectionId);

    revalidateTag(`bank_connections_${teamId}`);
    revalidateTag(`transactions_${teamId}`);
    revalidateTag(`spending_${teamId}`);
    revalidateTag(`metrics_${teamId}`);
    revalidateTag(`bank_accounts_${teamId}`);
    revalidateTag(`insights_${teamId}`);
  },
});
