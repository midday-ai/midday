import { client } from "@/trigger";
import { getTransactions } from "@midday/gocardless";
import { Database } from "@midday/supabase/src/types";
import { eventTrigger } from "@trigger.dev/sdk";
import { Supabase, SupabaseManagement } from "@trigger.dev/supabase";
import { capitalCase } from "change-case";
import { z } from "zod";

const mapTransactionMethod = (method: string) => {
  switch (method) {
    case "Payment":
    case "Bankgiro payment":
    case "Incoming foreign payment":
      return "payment";
    case "Card purchase":
    case "Card foreign purchase":
      return "card_purchase";
    case "Card ATM":
      return "card_atm";
    case "Transfer":
      return "transfer";
    default:
      return "other";
  }
};

const transformTransactions = (transactions, { teamId, accountId }) =>
  transactions.map((data) => ({
    transaction_id: data.transactionId,
    reference: data.entryReference,
    booking_date: data.bookingDate,
    date: data.valueDate,
    name: capitalCase(data.additionalInformation),
    original: data.additionalInformation,
    method: mapTransactionMethod(data.proprietaryBankTransactionCode),
    provider_transaction_id: data.internalTransactionId,
    amount: data.transactionAmount.amount,
    currency: data.transactionAmount.currency,
    bank_account_id: accountId,
    category: data.transactionAmount.amount > 0 ? "income" : null,
    team_id: teamId,
  }));

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
  version: "0.7.0",
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

    // use the account_id as the id for the DynamicSchedule
    // so it comes through to run() in the context source.id
    await dynamicSchedule.register(payload.record.account_id, {
      type: "interval",
      metadata: {
        accountId: payload.record.account_id,
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
  version: "0.7.0",
  trigger: dynamicSchedule,
  integrations: { supabase },
  run: async (_, io, ctx) => {
    const accountId = ctx.source.id;

    await io.logger.info(`Fetching Transactions for ID: ${accountId}`);

    // NOTE Can't get team id in ctx.metadata to work
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
      transformTransactions(transactions?.booked, {
        accountId,
        teamId: data?.team_id,
      }),
      {
        onConflict: "provider_transaction_id",
        ignoreDuplicates: true,
      },
    );

    await io.logger.info(`Total Transactions Created: ${count}`);
  },
});

client.defineJob({
  id: "transactions-initial-sync",
  name: "Transactions - Initial",
  version: "0.7.0",
  trigger: eventTrigger({
    name: "transactions.initial.sync",
    schema: z.object({
      accountId: z.string(),
      teamId: z.string(),
    }),
  }),
  integrations: { supabase },
  run: async (payload, io) => {
    const { accountId, teamId } = payload;
    await io.logger.info(`Fetching Transactions for ID: ${accountId}`);

    const { transactions } = await getTransactions(accountId);

    if (!transactions?.booked.length) {
      await io.logger.info("No transactions found");
    }

    const { count } = await io.supabase.client.from("transactions").insert(
      transformTransactions(transactions?.booked, {
        accountId,
        teamId: teamId,
      }),
    );

    await io.logger.info(`Total Transactions Created: ${count}`);
  },
});
