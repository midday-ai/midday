import { createBankAccounts } from "@midday/supabase/mutations";
import { eventTrigger } from "@trigger.dev/sdk";
// import { processPromisesBatch } from "@/utils/process";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { client, supabase } from "../client";
import { Events, Jobs } from "../constants";

const BATCH_LIMIT = 500;

client.defineJob({
  id: Jobs.TRANSACTIONS_SETUP,
  name: "Transactions - Setup",
  version: "0.0.1",
  trigger: eventTrigger({
    name: Events.TRANSACTIONS_SETUP,
    schema: z.object({
      //   transactionIds: z.array(z.string()),
      //   teamId: z.string(),
      //   locale: z.string(),
    }),
  }),
  integrations: { supabase },
  run: async (payload, io) => {
    const client = await io.supabase.client;

    // const { data } = await createBankAccounts(supabase, accounts);

    // const promises = data?.map(async (account) => {
    //   // Fetch transactions for each account
    //   const { transactions } = await getTransactions({
    //     accountId: account.account_id,
    //   });

    //   // Schedule sync for each account
    //   await scheduler.register(account.id, {
    //     type: "interval",
    //     options: {
    //       seconds: 3600, // every 1h
    //     },
    //   });

    //   const formattedTransactions = transformTransactions(
    //     transactions?.booked,
    //     {
    //       accountId: account.id, // Bank account row id
    //       teamId,
    //     }
    //   );

    //   // NOTE: We will get all the transactions at once so
    //   // we need to guard against massive payloads
    //   await processPromisesBatch(
    //     formattedTransactions,
    //     BATCH_LIMIT,
    //     async (batch) => {
    //       await supabase.from("transactions").upsert(batch, {
    //         onConflict: "internal_id",
    //         ignoreDuplicates: true,
    //       });
    //     }
    //   );

    //   return;
    // });

    // await Promise.all(promises);

    // revalidateTag(`bank_connections_${teamId}`);
    // revalidateTag(`transactions_${teamId}`);
    // revalidateTag(`spending_${teamId}`);
    // revalidateTag(`metrics_${teamId}`);
    // revalidateTag(`bank_accounts_${teamId}`);
    // revalidateTag(`insights_${teamId}`);
  },
});
