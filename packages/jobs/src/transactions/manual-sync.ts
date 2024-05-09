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
      accountId: z.string(),
    }),
  }),
  integrations: { supabase },
  run: async (payload, io) => {
    const supabase = await io.supabase.client;

    const { data: account } = await supabase
      .from("bank_accounts")
      .select(
        "id, team_id, account_id, bank_connection:bank_connection_id(provider, access_token)"
      )
      .eq("id", payload.accountId)
      .eq("enabled", true)
      .single();

    if (!account) {
      return null;
    }

    const { provider, access_token } = account.bank_connection;
    const teamId = account.team_id;

    const api = new Provider({
      provider,
    });

    const transactions = await api.getTransactions({
      teamId: account.team_id,
      accountId: account.account_id,
      accessToken: access_token,
      bankAccountId: account.id,
    });

    const formatted = transactions.map((transaction) => ({
      ...transaction,
      category_slug: transaction.category,
    }));

    // NOTE: We will get all the transactions at once for each account so
    // we need to guard against massive payloads
    const promises = await processPromisesBatch(
      formatted,
      BATCH_LIMIT,
      async (batch) => {
        return supabase
          .from("transactions")
          .upsert(batch, {
            onConflict: "internal_id",
            ignoreDuplicates: true,
          })
          .select();
      }
    );

    try {
      await Promise.all(promises);
    } catch (error) {
      await io.logger.error(error);
      throw Error("Something went wrong");
    }

    // Update bank account last_accessed
    await io.supabase.client
      .from("bank_accounts")
      .update({
        last_accessed: new Date().toISOString(),
      })
      .eq("id", account.id);

    revalidateTag(`bank_connections_${teamId}`);
    revalidateTag(`transactions_${teamId}`);
    revalidateTag(`spending_${teamId}`);
    revalidateTag(`metrics_${teamId}`);
    revalidateTag(`bank_accounts_${teamId}`);
    revalidateTag(`insights_${teamId}`);
  },
});
