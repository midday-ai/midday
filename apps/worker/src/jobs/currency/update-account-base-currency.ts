import {
  bulkUpdateTransactionsBaseCurrency,
  getExchangeRate,
  getTransactionsByAccount,
  updateAccountBaseCurrency,
} from "@midday/db/queries";
import {
  calculateAccountBaseBalance,
  calculateTransactionBaseAmount,
} from "@midday/db/utils/currency";
import { job } from "@worker/core/job";
import { z } from "zod";

const updateAccountBaseCurrencySchema = z.object({
  accountId: z.string().uuid(),
  teamId: z.string().uuid(),
  currency: z.string().min(3).max(3),
  balance: z.number(),
  baseCurrency: z.string().min(3).max(3),
});

export const updateAccountBaseCurrencyJob = job(
  "update-account-base-currency",
  updateAccountBaseCurrencySchema,
  {
    queue: "system",
    priority: 3,
    attempts: 3,
  },
  async (data, { db, logger }) => {
    const { accountId, teamId, currency, balance, baseCurrency } = data;

    logger.info("Starting account base currency update", {
      accountId,
      teamId,
      currency,
      baseCurrency,
    });

    // If currencies are the same, no conversion needed
    if (currency === baseCurrency) {
      logger.info("Currency already matches base currency", {
        accountId,
        currency,
        baseCurrency,
      });

      return {
        converted: false,
        baseBalance: balance,
        transactionsUpdated: 0,
      };
    }

    // Get exchange rate
    const exchangeRateData = await getExchangeRate(db, {
      base: currency,
      target: baseCurrency,
    });

    if (!exchangeRateData) {
      logger.error("No exchange rate found", {
        accountId,
        fromCurrency: currency,
        toCurrency: baseCurrency,
      });

      throw new Error(
        `No exchange rate found for ${currency} to ${baseCurrency}`,
      );
    }

    const rate = exchangeRateData.rate ?? 1;
    logger.info("Found exchange rate", {
      accountId,
      fromCurrency: currency,
      toCurrency: baseCurrency,
      rate,
    });

    // Calculate base balance
    const baseBalance = calculateAccountBaseBalance({
      balance,
      currency,
      baseCurrency,
      exchangeRate: rate,
    });

    // Update account base balance and currency
    await updateAccountBaseCurrency(db, {
      accountId,
      teamId,
      baseBalance,
      baseCurrency,
    });

    logger.info("Updated account base currency", {
      accountId,
      baseBalance,
      baseCurrency,
    });

    // Get all transactions for this account
    const transactions = await getTransactionsByAccount(db, {
      accountId,
      teamId,
    });

    if (transactions.length === 0) {
      logger.info("No transactions found for account", { accountId });
      return {
        converted: true,
        rate,
        transactionsUpdated: 0,
      };
    }

    logger.info("Found transactions to update", {
      accountId,
      transactionCount: transactions.length,
    });

    // Prepare transaction updates
    const transactionUpdates = transactions.map((transaction) => ({
      id: transaction.id,
      baseAmount: calculateTransactionBaseAmount({
        amount: transaction.amount ?? 0,
        currency: transaction.currency,
        baseCurrency,
        exchangeRate: rate,
      }),
      baseCurrency,
    }));

    // Bulk update transactions
    const updatedTransactions = await bulkUpdateTransactionsBaseCurrency(db, {
      transactionUpdates,
      teamId,
    });

    logger.info("Account base currency update completed", {
      accountId,
      transactionsUpdated: updatedTransactions.length,
      baseCurrency,
      rate,
    });

    return {
      converted: true,
      rate,
      transactionsUpdated: updatedTransactions.length,
    };
  },
);
