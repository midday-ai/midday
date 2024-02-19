import { getTransactions, transformTransactions } from "@midday/gocardless";
import { formatISO, subMonths } from "date-fns";
import { revalidateTag } from "next/cache";
import { client, supabase } from "../client";
import { Events, Jobs } from "../constants";
import { scheduler } from "./scheduler";

client.defineJob({
  id: Jobs.TRANSACTIONS_SYNC,
  name: "Transactions - Sync",
  version: "0.0.1",
  trigger: scheduler,
  integrations: { supabase },
  run: async (_, io, ctx) => {
    const { data } = await io.supabase.client
      .from("bank_accounts")
      .select("id, team_id, account_id")
      .eq("id", ctx.source.id)
      .single();

    const teamId = data?.team_id;

    await io.logger.debug("Team id", teamId);

    // Update bank account last_accessed
    await io.supabase.client
      .from("bank_accounts")
      .update({
        last_accessed: new Date().toISOString(),
      })
      .eq("id", ctx.source.id);

    if (!data) {
      await io.logger.error(`Bank account not found: ${ctx.source.id}`);
      await scheduler.unregister(ctx.source.id);

      return;
    }

    const { transactions } = await getTransactions({
      accountId: data?.account_id,
      // NOTE: GET last 30 days transactions
      date_to: formatISO(subMonths(new Date(), 1), {
        representation: "date",
      }),
    });

    const formattedTransactions = transformTransactions(transactions?.booked, {
      accountId: data?.id,
      teamId,
    });

    const { error, data: transactionsData } = await io.supabase.client
      .from("decrypted_transactions")
      .upsert(formattedTransactions, {
        onConflict: "internal_id",
        ignoreDuplicates: true,
      })
      .select("*, name:decrypted_name");

    if (error) {
      await io.logger.debug("Transactions batch error", error);
    }

    if (transactionsData && transactionsData?.length > 0) {
      await io.logger.log(`Sending notifications: ${transactionsData.length}`);

      await io.sendEvent("🔔 Send notifications", {
        name: Events.TRANSACTIONS_NOTIFICATION,
        payload: {
          teamId,
          transactions: transactionsData,
        },
      });
    }

    revalidateTag(`transactions_${teamId}`);
    revalidateTag(`spending_${teamId}`);
    revalidateTag(`metrics_${teamId}`);
    revalidateTag(`bank_accounts_${teamId}`);

    await io.logger.info(`Transactions Created: ${transactionsData?.length}`);
  },
});
