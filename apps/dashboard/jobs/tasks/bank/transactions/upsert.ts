import { createClient } from "@midday/supabase/job";
import { logger, schemaTask } from "@trigger.dev/sdk/v3";
import { transformTransaction } from "jobs/utils/transform";
import { z } from "zod";
// import { enrichTransactions } from "../../transactions/enrich";

const transactionSchema = z.object({
  id: z.string(),
  description: z.string().nullable(),
  method: z.string().nullable(),
  date: z.string(),
  name: z.string(),
  status: z.enum(["pending", "posted"]),
  balance: z.number().nullable(),
  currency: z.string(),
  amount: z.number(),
  category: z.string().nullable(),
});

export const upsertTransactions = schemaTask({
  id: "upsert-transactions",
  maxDuration: 300,
  queue: {
    concurrencyLimit: 10,
  },
  schema: z.object({
    teamId: z.string().uuid(),
    bankAccountId: z.string().uuid(),
    manualSync: z.boolean().optional(),
    transactions: z.array(transactionSchema),
  }),
  run: async ({ transactions, teamId, bankAccountId, manualSync }) => {
    const supabase = createClient();

    try {
      // Transform transactions to match our DB schema
      const formattedTransactions = transactions.map((transaction) => {
        return transformTransaction({
          transaction,
          teamId,
          bankAccountId,
          notified: manualSync,
        });
      });

      // Upsert transactions into the transactions table, skipping duplicates based on internal_id
      const { data: upsertedTransactions } = await supabase
        .from("transactions")
        .upsert(formattedTransactions, {
          onConflict: "internal_id",
          ignoreDuplicates: true,
        })
        .select()
        .throwOnError();

      // Filter out transactions that are not uncategorized expenses
      // const uncategorizedExpenses = upsertedTransactions?.filter(
      //   (transaction) => !transaction.category && transaction.amount < 0,
      // );

      // if (uncategorizedExpenses?.length) {
      //   // We only want to wait for enrichment if this is a manual sync
      //   if (manualSync) {
      //     await enrichTransactions.triggerAndWait({
      //       transactions: uncategorizedExpenses.map((transaction) => ({
      //         id: transaction.id,
      //         name: transaction.name,
      //       })),
      //     });
      //   } else {
      //     await enrichTransactions.trigger({
      //       transactions: uncategorizedExpenses.map((transaction) => ({
      //         id: transaction.id,
      //         name: transaction.name,
      //       })),
      //     });
      //   }
      // }
    } catch (error) {
      logger.error("Failed to upsert transactions", { error });

      throw error;
    }
  },
});
