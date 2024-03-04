import { processPromisesBatch } from "@/utils/process";
import { getTransactions } from "@midday/gocardless";
import { transformTransactions } from "@midday/gocardless/src/transform";
import { eventTrigger } from "@trigger.dev/sdk";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { client, supabase } from "../client";
import { Events, Jobs } from "../constants";
import { scheduler } from "./scheduler";

const BATCH_LIMIT = 300;

client.defineJob({
  id: Jobs.TRANSACTIONS_SETUP,
  name: "Transactions - Setup",
  version: "0.0.1",
  trigger: eventTrigger({
    name: Events.TRANSACTIONS_SETUP,
    schema: z.object({
      teamId: z.string(),
      provider: z.enum(["gocardless", "plaid", "teller"]),
      accounts: z.array(
        z.object({
          id: z.string(),
          account_id: z.string(),
        })
      ),
    }),
  }),
  integrations: { supabase },
  run: async (payload, io) => {
    const supabase = await io.supabase.client;

    const { teamId, accounts } = payload;

    const promises = accounts?.map(async (account) => {
      // Fetch transactions for each account
      const { transactions } = await getTransactions({
        accountId: account.account_id,
      });

      // Schedule sync for each account
      await scheduler.register(account.id, {
        type: "interval",
        options: {
          seconds: 3600, // every 1h
        },
      });

      const formattedTransactions = transformTransactions(
        transactions?.booked,
        {
          accountId: account.id, // Bank account record id
          teamId,
        }
      );

      // NOTE: We will get all the transactions at once for each account so
      // we need to guard against massive payloads
      await processPromisesBatch(
        formattedTransactions,
        BATCH_LIMIT,
        async (batch) => {
          await supabase.from("transactions").upsert(batch, {
            onConflict: "internal_id",
            ignoreDuplicates: true,
          });
        }
      );
    });

    try {
      await Promise.all(promises);
    } catch (error) {
      await io.logger.error(error);
      throw Error("Something went wrong");
    }

    revalidateTag(`bank_connections_${teamId}`);
    revalidateTag(`transactions_${teamId}`);
    revalidateTag(`spending_${teamId}`);
    revalidateTag(`metrics_${teamId}`);
    revalidateTag(`bank_accounts_${teamId}`);
    revalidateTag(`insights_${teamId}`);
  },
});
