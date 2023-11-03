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
  run: async (payload, io) => {
    await io.logger.info(`Fetching Transactions for ID: ${payload.accountId}`);

    const transactions = await getTransactions(payload.accountId);

    const { count } = await supabase.client.from("transactions").upsert(
      transactions.map((transaction) => ({
        ...transaction,
        team_id: payload.teamId,
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
        teamId: payload.record.team_id,
      },
    });

    await dynamicSchedule.register(payload.record.id, {
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
      teamId: z.string(),
    }),
  }),
  integrations: { supabase },
  run: async (payload, io, ctx) => {
    await io.logger.info(`Fetching Transactions for ID: ${payload.accountId}`);

    const transactions = await getTransactions(payload.accountId);

    const { count } = await supabase.client.from("transactions").insert(
      transactions.map((transaction) => ({
        ...transaction,
        team_id: payload.teamId,
      })),
    );

    await io.logger.info(`Total Transactions Created: ${count}`);
  },
});
