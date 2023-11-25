import { client } from "@/trigger";
import { TransactionsEmail } from "@midday/email/emails/transactions";
import { getI18n } from "@midday/email/locales";
import { getTransactions } from "@midday/gocardless";
import { TriggerEvents, triggerBulk } from "@midday/notification";
import { getTransactionsQuery } from "@midday/supabase/queries";
import { Database } from "@midday/supabase/src/types";
import { renderAsync } from "@react-email/components";
import { eventTrigger } from "@trigger.dev/sdk";
import { Supabase, SupabaseManagement } from "@trigger.dev/supabase";
import { capitalCase } from "change-case";
import { revalidateTag } from "next/cache";
import { z } from "zod";

export async function processPromisesBatch(
  items: Array<any>,
  limit: number,
  fn: (item: any) => Promise<any>
): Promise<any> {
  let results = [];
  for (let start = 0; start < items.length; start += limit) {
    const end = start + limit > items.length ? items.length : start + limit;

    const slicedResults = await Promise.all(items.slice(start, end).map(fn));

    results = [...results, ...slicedResults];
  }

  return results;
}

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
  // We want to insert transactions in reversed order so the incremental id in supabase is correct
  transactions?.reverse().map((data) => ({
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
  version: "1.0.0",
  trigger: supabaseTriggers.onInserted({
    table: "bank_accounts",
  }),
  run: async (payload, io) => {
    await io.sendEvent("Transactions Initial Sync", {
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
        seconds: 3600, // every 1h
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

    // Update bank account last_accessed
    await io.supabase.client
      .from("bank_accounts")
      .update({
        last_accessed: new Date(),
      })
      .eq("id", ctx.source.id);

    revalidateTag(`bank_accounts_${data?.team_id}`);
    await io.logger.info(`bank_accounts_${data?.team_id}`);

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

    const { data: usersData } = await io.supabase.client
      .from("users_on_team")
      .select("team_id, user:user_id(id, full_name, avatar_url, email, locale)")
      .eq("team_id", data?.team_id);

    if (transactionsData?.length && transactionsData.length > 0) {
      revalidateTag(`transactions_${data?.team_id}`);
      revalidateTag(`spending_${data?.team_id}`);
      revalidateTag(`metrics_${data?.team_id}`);

      const notificationEvents = await Promise.all(
        usersData?.map(async ({ user, team_id }) => {
          const { t } = getI18n({ locale: user.locale });

          return transactionsData.map((transaction) => ({
            name: TriggerEvents.TransactionNewInApp,
            payload: {
              transactionId: transaction.id,
              description: t(
                { id: "notifications.transaction" },
                {
                  amount: Intl.NumberFormat(user.locale, {
                    style: "currency",
                    currency: transaction.currency,
                  }).format(transaction.amount),
                  from: transaction.name,
                }
              ),
            },
            user: {
              subscriberId: user.id,
              teamId: team_id,
              email: user.email,
              fullName: user.full_name,
              avatarUrl: user.avatar_url,
            },
          }));
        })
      );

      if (notificationEvents?.length) {
        triggerBulk(notificationEvents.flat());
      }

      const emailEvents = await Promise.all(
        usersData?.map(async ({ user, team_id }) => {
          const { t } = getI18n({ locale: user.locale });

          const html = await renderAsync(
            TransactionsEmail({
              fullName: user.full_name,
              transactions: transactionsData.map((transaction) => ({
                id: transaction.id,
                date: transaction.date,
                amount: transaction.amount,
                name: transaction.name,
                currency: transaction.currency,
              })),
              locale: user.locale,
            })
          );

          return {
            name: TriggerEvents.TransactionNewEmail,
            payload: {
              subject: t({ id: "transactions.subject" }),
              html,
            },
            user: {
              subscriberId: user.id,
              teamId: team_id,
              email: user.email,
              fullName: user.full_name,
              avatarUrl: user.avatar_url,
            },
          };
        })
      );

      if (emailEvents?.length) {
        triggerBulk(emailEvents);
      }
    }

    await io.sendEvent("Enrich Transactions", {
      name: "transactions.encrichment",
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

client.defineJob({
  id: "transactions-initial-sync",
  name: "Transactions - Initial Sync",
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

    // Update bank account last_accessed
    await io.supabase.client
      .from("bank_accounts")
      .update({
        last_accessed: new Date(),
      })
      .eq("id", recordId);

    if (!transactions?.booked.length) {
      await io.logger.info("No transactions found");
    }

    const { data: transactionsData, error } = await io.supabase.client
      .from("transactions")
      .insert(
        transformTransactions(transactions?.booked, {
          accountId: recordId, // Bank account record id
          teamId: teamId,
        })
      )
      .select();

    if (transactionsData?.length && transactionsData.length > 0) {
      revalidateTag(`transactions_${teamId}`);
      revalidateTag(`spending_${teamId}`);
      revalidateTag(`metrics_${teamId}`);

      await io.sendEvent("Enrich Transactions", {
        name: "transactions.encrichment",
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

client.defineJob({
  id: "transactions-encrichment",
  name: "Transactions - Enrichment",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "transactions.encrichment",
    schema: z.object({
      teamId: z.string(),
    }),
  }),
  integrations: { supabase },
  run: async (payload, io) => {
    const { teamId } = payload;

    // const { data: transactionsData } = await io.supabase.client
    //   .from("transactions")
    //   .select("id, name")
    //   .eq("team_id", teamId)
    //   .is("category", null)
    //   .is("logo_url", null)
    //   .is("enrichment_id", null)
    //   .select();

    // async function enrichTransactions(transaction) {
    //   const { data } = await io.supabase.client
    //     .rpc("search_enriched_transactions", { term: transaction.name })
    //     .single();

    //   if (data) {
    //     return {
    //       ...transaction,
    //       enrichment_id: data?.id ?? null,
    //     };
    //   }
    // }

    // const result = await processPromisesBatch(
    //   transactionsData,
    //   5,
    //   enrichTransactions
    // );

    // const filteredItems = result.filter(Boolean);

    // if (filteredItems.length > 0) {
    //   const { data: updatedTransactions } = await io.supabase.client
    //     .from("transactions")
    //     .upsert(filteredItems)
    //     .select();

    //   if (updatedTransactions?.length > 0) {
    //     revalidateTag(`transactions_${teamId}`);
    //     revalidateTag(`spending_${teamId}`);
    //     revalidateTag(`metrics_${teamId}`);

    //     await io.logger.info(
    //       `Transactions Enriched: ${updatedTransactions?.length}`
    //     );
    //   }
    // }
  },
});

client.defineJob({
  id: "transactions-export",
  name: "Transactions - Export",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "transactions.export",
    schema: z.object({
      from: z.coerce.date(),
      to: z.coerce.date(),
      teamId: z.string(),
    }),
  }),
  integrations: { supabase },
  run: async (payload, io) => {
    const { from, to, teamId } = payload;

    const client = await io.supabase.client;

    const generateExport = await io.createStatus("generate-export-start", {
      label: "Generating export",
      state: "loading",
    });

    await io.logger.info("Transactions Export");

    const data = await getTransactionsQuery(client, {
      teamId,
      from: 0,
      to: 100000,
      filter: {
        date: {
          from: from.toDateString(),
          to: to.toDateString(),
        },
      },
    });

    await io.logger.info(`Transactions: ${JSON.stringify(data, null, 2)}`);

    await generateExport.update("generate-export-done", {
      state: "success",
      data: {
        url: "",
      },
    });
  },
});
