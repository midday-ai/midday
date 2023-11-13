import { client } from "@/trigger";
import { getTransactions } from "@midday/gocardless";
import { Database } from "@midday/supabase/src/types";
import { eventTrigger } from "@trigger.dev/sdk";
import { Supabase, SupabaseManagement } from "@trigger.dev/supabase";
import { capitalCase } from "change-case";
import { revalidateTag } from "next/cache";
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
    internal_id: data.internalTransactionId,
    amount: data.transactionAmount.amount,
    currency: data.transactionAmount.currency,
    bank_account_id: accountId,
    category: data.transactionAmount.amount > 0 ? "income" : "uncategorized",
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
  version: "1.0.0",
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
        recordId: payload.record.id,
      },
    });

    // use the bank account row id as the id for the DynamicSchedule
    // so it comes through to run() in the context source.id
    await dynamicSchedule.register(payload.record.id, {
      type: "interval",
      options: {
        seconds: 10 * 60, // 10 minutes
      },
    });
  },
});

client.defineJob({
  id: "transactions-sync",
  name: "Transactions - Latest Transactions",
  version: "1.0.0",
  trigger: dynamicSchedule,
  integrations: { supabase },
  run: async (_, io, ctx) => {
    const { data } = await io.supabase.client
      .from("bank_accounts")
      .select("id,team_id,account_id")
      .eq("id", ctx.source.id)
      .single();

    if (!data) {
      await io.logger.error(`Bank account not found: ${ctx.source.id}`);
      await dynamicSchedule.unregister(ctx.source.id);
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

    if (transactionsData?.length && transactionsData.length > 0) {
      revalidateTag(`transactions_${data?.team_id}`);
      revalidateTag(`spending_${data?.team_id}`);
      revalidateTag(`metrics_${data?.team_id}`);
    }

    if (error) {
      await io.logger.error(JSON.stringify(error, null, 2));
    }

    await io.logger.info(`Transactions Created: ${transactionsData?.length}`);
  },
});

client.defineJob({
  id: "transactions-initial-sync",
  name: "Transactions - Initial",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "transactions.initial.sync",
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

    if (!transactions?.booked.length) {
      await io.logger.info("No transactions found");
    }

    const { data: transactionsData, error } = await io.supabase.client
      .from("transactions")
      .insert(
        transformTransactions(transactions?.booked, {
          accountId: recordId,
          teamId: teamId,
        })
      )
      .select();

    if (transactionsData?.length && transactionsData.length > 0) {
      revalidateTag(`transactions_${teamId}`);
      revalidateTag(`spending_${teamId}`);
      revalidateTag(`metrics_${teamId}`);
    }

    if (error) {
      await io.logger.error(JSON.stringify(error, null, 2));
    }

    await io.logger.info(`Transactions Created: ${transactionsData?.length}`);
  },
});
