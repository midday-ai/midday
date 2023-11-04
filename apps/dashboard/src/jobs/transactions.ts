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
  id: "bank-account-created",
  name: "Bank Account Created",
  version: "0.5.0",
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

    //use the id as the id for the DynamicSchedule
    //so it comes through to run() in the context source.id
    await dynamicSchedule.register(payload.record.id, {
      type: "interval",
      metadata: {
        accountId: payload.record.account_id,
        teamId: payload.record.team_id,
      },
      options: {
        seconds: 36000,
      },
    });
  },
});

client.defineJob({
  id: "transactions-sync",
  name: "Transactions - Latest Transactions",
  version: "0.5.0",
  trigger: dynamicSchedule,
  integrations: { supabase },
  run: async (payload, io, ctx) => {
    const { accountId, teamId } = ctx.source.metadata;

    await io.logger.info(
      `Fetching Transactions for Team ID: ${teamId} and account ID: ${accountId}`,
    );

    const { transactions } = await getTransactions(accountId);

    if (!transactions?.booked.length) {
      await io.logger.info("No transactions found");
    }

    const { count } = await io.supabase.client.from("transactions").upsert(
      transactions.booked.map((transaction) => ({
        ...transaction,
        team_id: teamId,
      })),
      { onConflict: "provider_transaction_id", ignoreDuplicates: false },
    );

    await io.logger.info(`Total Transactions Created: ${count}`);
  },
});

client.defineJob({
  id: "transactions-initial-sync",
  name: "Transactions - Initial",
  version: "0.5.0",
  trigger: eventTrigger({
    name: "transactions.initial.sync",
    schema: z.object({
      accountId: z.string(),
      teamId: z.string(),
    }),
  }),
  integrations: { supabase },
  run: async (payload, io) => {
    await io.logger.info(`Fetching Transactions for ID: ${payload.accountId}`);

    const { transactions } = await getTransactions(payload.accountId);

    if (!transactions?.booked.length) {
      await io.logger.info("No transactions found");
    }

    const { count } = await io.supabase.client.from("transactions").insert(
      transactions?.booked.map((transaction) => ({
        ...transaction,
        team_id: payload.teamId,
      })),
    );

    await io.logger.info(`Total Transactions Created: ${count}`);
  },
});
