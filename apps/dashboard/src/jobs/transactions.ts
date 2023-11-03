import { client } from "@/trigger";
import { getTransactions } from "@midday/gocardless";
import { Database } from "@midday/supabase/src/types";
import { eventTrigger } from "@trigger.dev/sdk";
import { Supabase, SupabaseManagement } from "@trigger.dev/supabase";
import { z } from "zod";

const supabaseManagement = new SupabaseManagement({
  id: "supabase-integration",
});

const supabaseTriggers = supabaseManagement.db(process.env.SUPABASE_ID!);

export const supabase = new Supabase<Database>({
  id: "supabase",
  projectId: process.env.SUPABASE_ID!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
});

const dynamicSchedule = client.defineDynamicSchedule({
  id: "transaction-scheduler",
});

client.defineJob({
  id: "transactions-sync",
  name: "Transactions - Latest Transactions",
  version: "0.4.0",
  trigger: dynamicSchedule,
  integrations: { supabase },
  run: async (_, io) => {
    const accountId = ctx.source.id;
    await io.logger.info(`Fetching Transactions for ID: ${accountId}`);

    const { data } = await io.supabase.client
      .from("bank_accounts")
      .select("team_id")
      .eq("account_id", accountId)
      .single();

    const { transactions } = await getTransactions(accountId);

    if (!transactions?.booked.length) {
      await io.logger.info("No transactions found");
    }

    const { count } = await io.supabase.client.from("transactions").upsert(
      transactions.booked.map((transaction) => ({
        ...transaction,
        team_id: data?.team_id,
      })),
      { onConflict: "provider_transaction_id", ignoreDuplicates: false },
    );

    await io.logger.info(`Total Transactions Created: ${count}`);
  },
});

client.defineJob({
  id: "bank-account-created",
  name: "Bank Account Created",
  version: "0.4.0",
  trigger: supabaseTriggers.onInserted({
    table: "bank_accounts",
  }),
  run: async (payload, io) => {
    await io.sendEvent("Schedule Transactions", {
      id: payload.record.id,
      name: "transactions.initial.sync",
      payload: {
        accountId: payload.record.account_id,
      },
    });

    //use the account_id as the id for the DynamicSchedule
    //so it comes through to run() in the context source.id
    await dynamicSchedule.register(payload.record.account_id, {
      type: "cron",
      options: {
        cron: "0 * * * *",
      },
    });
  },
});

client.defineJob({
  id: "transactions-initial-sync",
  name: "Transactions - Initial",
  version: "0.4.0",
  trigger: eventTrigger({
    name: "transactions.initial.sync",
    schema: z.object({
      accountId: z.string(),
    }),
  }),
  integrations: { supabase },
  run: async (payload, io) => {
    const { accountId } = payload;

    await io.logger.info(`Fetching Transactions for ID: ${accountId}`);

    const { data } = await io.supabase.client
      .from("bank_accounts")
      .select("team_id")
      .eq("account_id", accountId)
      .single();

    const { transactions } = await getTransactions(accountId);

    if (!transactions?.booked.length) {
      await io.logger.info("No transactions found");
    }

    const { count } = await io.supabase.client.from("transactions").insert(
      transactions?.booked.map((transaction) => ({
        ...transaction,
        team_id: data?.team_id,
      })),
    );

    await io.logger.info(`Total Transactions Created: ${count}`);
  },
});
