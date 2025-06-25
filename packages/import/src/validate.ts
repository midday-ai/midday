import { z } from "zod";
import type { Transaction } from "./types";

export const createTransactionSchema = z.object({
  name: z.string(),
  currency: z.string(),
  bankAccountId: z.string(),
  teamId: z.string(),
  internalId: z.string(),
  status: z.enum(["posted", "pending"]),
  method: z.enum(["card", "bank", "other"]),
  date: z.coerce.date(),
  amount: z.number(),
  manual: z.boolean(),
  categorySlug: z.string().nullable(),
});

export const validateTransactions = (transactions: Transaction[]) => {
  const processedTransactions = transactions.map((transaction) =>
    createTransactionSchema.safeParse(transaction),
  );

  const validTransactions = processedTransactions.filter(
    (transaction) => transaction.success,
  );

  const invalidTransactions = processedTransactions.filter(
    (transaction) => !transaction.success,
  );

  return {
    validTransactions: validTransactions.map((transaction) => transaction.data),
    invalidTransactions: invalidTransactions.map(
      (transaction) => transaction.error,
    ),
  };
};
