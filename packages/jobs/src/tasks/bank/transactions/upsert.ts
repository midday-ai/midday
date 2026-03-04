import { transformTransaction } from "@jobs/utils/transform";
import { createClient } from "@midday/supabase/job";
import { logger, schemaTask, tasks } from "@trigger.dev/sdk";
import { z } from "zod";
import { enrichTransactions } from "../../transactions/enrich-transaction";

const transactionSchema = z.object({
  id: z.string(),
  description: z.string().nullable(),
  method: z.string().nullable(),
  date: z.string(),
  name: z.string(),
  status: z.enum(["pending", "posted"]),
  counterparty_name: z.string().nullable(),
  merchant_name: z.string().nullable(),
  balance: z.number().nullable(),
  currency: z.string(),
  amount: z.number(),
  category: z.string().nullable(),
});

export const upsertTransactions = schemaTask({
  id: "upsert-transactions",
  maxDuration: 120,
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
          // @ts-expect-error - TODO: Fix types with drizzle
          transaction,
          teamId,
          bankAccountId,
          notified: manualSync,
        });
      });

      // Upsert transactions into the transactions table, skipping duplicates based on internal_id
      const { data: upsertedTransactions } = await supabase
        .from("transactions")
        // @ts-expect-error - TODO: Fix types with drizzle
        .upsert(formattedTransactions, {
          onConflict: "internal_id",
          ignoreDuplicates: true,
        })
        .select("id")
        .throwOnError();

      const transactionIds = upsertedTransactions?.map((tx) => tx.id) || [];

      if (transactionIds.length > 0) {
        await enrichTransactions.trigger({
          transactionIds,
          teamId,
        });

        await tasks.trigger("match-transactions-bidirectional", {
          teamId,
          newTransactionIds: transactionIds,
        });

        logger.info("Triggered enrichment and matching", {
          transactionCount: transactionIds.length,
          teamId,
        });
      }
    } catch (error) {
      logger.error("Failed to upsert transactions", { error });

      throw error;
    }
  },
});
