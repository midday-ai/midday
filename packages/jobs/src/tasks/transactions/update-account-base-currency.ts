import { getDb } from "@jobs/init";
import {
  getAccountBalance,
  getTransactionAmount,
} from "@jobs/utils/base-currency";
import { processBatch } from "@jobs/utils/process-batch";
import {
  getExchangeRate,
  getTransactionsByAccount,
  updateBankAccount,
  upsertTransactions,
} from "@midday/db/queries";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";

const BATCH_LIMIT = 500;

export const updateAccountBaseCurrency = schemaTask({
  id: "update-account-base-currency",
  schema: z.object({
    accountId: z.string().uuid(),
    currency: z.string(),
    balance: z.number(),
    baseCurrency: z.string(),
  }),
  maxDuration: 120,
  queue: {
    concurrencyLimit: 10,
  },
  run: async ({ accountId, currency, balance, baseCurrency }) => {
    const db = getDb();

    const exchangeRate = await getExchangeRate(db, {
      base: currency,
      target: baseCurrency,
    });

    if (!exchangeRate) {
      logger.info("No exchange rate found", {
        currency,
        baseCurrency,
      });

      return;
    }

    // Update account base balance and base currency
    // based on the new currency exchange rate
    await updateBankAccount(db, {
      id: accountId,
      // No teamId needed in trusted job context
      baseBalance: getAccountBalance({
        currency: currency,
        balance,
        baseCurrency,
        rate: exchangeRate.rate,
      }),
      baseCurrency: baseCurrency,
    });

    const transactionsData = await getTransactionsByAccount(db, {
      accountId,
    });

    const formattedTransactions = transactionsData?.map(
      // Exclude fts_vector from the transaction object because it's a generated column
      ({ ftsVector, ...transaction }) => ({
        name: transaction.name,
        internalId: transaction.internalId,
        categorySlug: transaction.categorySlug,
        bankAccountId: transaction.bankAccountId,
        description: transaction.description,
        balance: transaction.balance,
        currency: transaction.currency,
        method: transaction.method,
        amount: transaction.amount,
        teamId: transaction.teamId,
        date: transaction.date,
        status: transaction.status,
        notified: transaction.notified,
        counterpartyName: transaction.counterpartyName,
        baseAmount: getTransactionAmount({
          amount: transaction.amount,
          currency: transaction.currency,
          baseCurrency,
          rate: exchangeRate?.rate,
        }),
        baseCurrency: baseCurrency,
      }),
    );

    if (formattedTransactions && formattedTransactions.length > 0) {
      await upsertTransactions(db, {
        transactions: formattedTransactions,
        batchSize: BATCH_LIMIT,
      });
    }
  },
});
