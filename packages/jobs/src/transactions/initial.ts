import { getTransactions } from "@midday/gocardless";
import { eventTrigger } from "@trigger.dev/sdk";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { client, supabase } from "../client";
import { Events, Jobs } from "../constants";
import { transformTransactions } from "../utils";

client.defineJob({
  id: Jobs.TRANSACTIONS_INITIAL_SYNC,
  name: "🔂 Transactions - Initial Sync",
  version: "1.0.2",
  trigger: eventTrigger({
    name: Events.TRANSACTIONS_INITIAL_SYNC,
    schema: z.object({
      accountId: z.string(),
      teamId: z.string(),
      recordId: z.string(),
    }),
  }),
  integrations: { supabase },
  run: async (payload, io) => {
    const { accountId, teamId, recordId } = payload;

    const { transactions } = await getTransactions(accountId);

    await io.logger.error(JSON.stringify(transactions, null, 2));

    // Update bank account last_accessed
    await io.supabase.client
      .from("bank_accounts")
      .update({
        last_accessed: new Date().toISOString(),
      })
      .eq("id", recordId);

    const { data: transactionsData, error } = await io.supabase.client
      .from("transactions")
      .insert(
        transformTransactions(transactions?.booked, {
          accountId: recordId, // Bank account record id
          teamId,
        })
      )
      .select();

    if (transactionsData?.length && transactionsData.length > 0) {
      revalidateTag(`transactions_${teamId}`);
      revalidateTag(`spending_${teamId}`);
      revalidateTag(`metrics_${teamId}`);

      await io.sendEvent("💅 Enrich Transactions", {
        name: Events.TRANSACTIONS_ENCRICHMENT,
        payload: {
          teamId,
        },
      });
    }

    if (error) {
      await io.logger.error(JSON.stringify(error, null, 2));
    }

    await io.logger.info(`Transactions Created: ${transactionsData?.length}`);
  },
});
