import { client } from "@/trigger";
import { getTransactions } from "@midday/gocardless";
import { revalidateTag } from "next/cache";
import { supabase } from "../client";
import { Events, Jobs } from "../constants";
import { scheduler } from "./scheduler";
import { transformTransactions } from "./utils";

client.defineJob({
  id: Jobs.TRANSACTIONS_SYNC,
  name: "🔄 Transactions - Latest Transactions",
  version: "1.0.1",
  trigger: scheduler,
  integrations: { supabase },
  run: async (_, io, ctx) => {
    const { data } = await io.supabase.client
      .from("bank_accounts")
      .select("id,team_id,account_id")
      .eq("id", ctx.source.id)
      .single();

    // Update bank account last_accessed
    await io.supabase.client
      .from("bank_accounts")
      .update({
        last_accessed: new Date().toISOString(),
      })
      .eq("id", ctx.source.id);

    revalidateTag(`bank_accounts_${data?.team_id}`);
    await io.logger.info(`bank_accounts_${data?.team_id}`);

    if (!data) {
      await io.logger.error(`Bank account not found: ${ctx.source.id}`);
      await scheduler.unregister(ctx.source.id);
      // TODO: Delete requisitions
    }

    const { transactions } = await getTransactions(data?.account_id);

    if (!transactions?.booked.length) {
      await io.logger.info("No transactions found");
    }

    const { data: transactionsData, error } = await io.supabase.client
      .from("transactions")
      .upsert(
        transformTransactions(transactions?.booked, {
          accountId: data?.id,
          teamId: data?.team_id,
        }),
        {
          onConflict: "internal_id",
          ignoreDuplicates: true,
        }
      )
      .select();

    await io.sendEvent("🔔 Send notifications", {
      name: Events.TRANSACTIONS_NOTIFICATION,
      payload: {
        teamId: data?.team_id,
        transactions: transactionsData,
      },
    });

    await io.sendEvent("💅 Enrich Transactions", {
      name: Events.TRANSACTIONS_ENCRICHMENT,
      payload: {
        teamId: data?.team_id,
      },
    });

    if (error) {
      await io.logger.error(JSON.stringify(error, null, 2));
    }

    await io.logger.info(`Transactions Created: ${transactionsData?.length}`);
  },
});
