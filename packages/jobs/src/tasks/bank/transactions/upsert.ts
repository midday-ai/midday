import { getDb } from "@jobs/init";
import { transformTransaction } from "@jobs/utils/transform";
import { upsertTransactions as upsertTransactionsDb } from "@midday/db/queries";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";

const transactionSchema = z.object({
  id: z.string(),
  description: z.string().nullable(),
  method: z.string().nullable(),
  date: z.string(),
  name: z.string(),
  status: z.enum(["pending", "posted"]),
  counterparty_name: z.string().nullable(),
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
    const db = getDb();

    try {
      // Transform transactions to match our DB schema
      const formattedTransactions = transactions.map((transaction) => {
        const transformed = transformTransaction({
          // @ts-expect-error - TODO: Fix types with drizzle
          transaction,
          teamId,
          bankAccountId,
          notified: manualSync,
        });

        // Map the transformed transaction to our upsert format
        return {
          name: transformed.name,
          internalId: transformed.internal_id,
          categorySlug: transformed.category_slug,
          bankAccountId: transformed.bank_account_id,
          description: transformed.description,
          balance: transformed.balance,
          currency: transformed.currency,
          method: (transformed.method as any) || "other",
          amount: transformed.amount,
          teamId: transformed.team_id,
          date: transformed.date,
          status: transformed.status,
          notified: transformed.notified,
          counterpartyName: transformed.counterparty_name,
        };
      });

      // Insert transactions, ignoring duplicates based on internalId
      await upsertTransactionsDb(db, {
        transactions: formattedTransactions,
      });
    } catch (error) {
      logger.error("Failed to upsert transactions", { error });

      throw error;
    }
  },
});
