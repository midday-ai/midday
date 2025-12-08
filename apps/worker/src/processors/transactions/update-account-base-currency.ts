import {
  bulkUpdateTransactionsBaseCurrency,
  getBankAccountTeamId,
  getExchangeRate,
  getTransactionsByAccountId,
  updateBankAccount,
} from "@midday/db/queries";
import type { Job } from "bullmq";
import type { UpdateAccountBaseCurrencyPayload } from "../../schemas/transactions";
import {
  getAccountBalance,
  getTransactionAmount,
} from "../../utils/base-currency";
import { getDb } from "../../utils/db";
import { BaseProcessor } from "../base";

/**
 * Updates base currency for a specific account
 * Updates account balance and all transactions for the account
 */
export class UpdateAccountBaseCurrencyProcessor extends BaseProcessor<UpdateAccountBaseCurrencyPayload> {
  async process(job: Job<UpdateAccountBaseCurrencyPayload>): Promise<void> {
    const { accountId, currency, balance, baseCurrency } = job.data;
    const db = getDb();

    this.logger.info("Starting update-account-base-currency job", {
      jobId: job.id,
      accountId,
      currency,
      baseCurrency,
    });

    // Get exchange rate
    const exchangeRate = await getExchangeRate(db, {
      base: currency,
      target: baseCurrency,
    });

    if (!exchangeRate || !exchangeRate.rate) {
      this.logger.info("No exchange rate found", {
        currency,
        baseCurrency,
        accountId,
      });
      return;
    }

    const rate = Number(exchangeRate.rate);

    // Update account base balance and base currency
    // Get teamId from account - we need to find it first
    const teamId = await getBankAccountTeamId(db, { id: accountId });

    if (!teamId) {
      throw new Error(`Account not found: ${accountId}`);
    }

    await updateBankAccount(db, {
      id: accountId,
      teamId,
      baseBalance: getAccountBalance({
        currency,
        balance,
        baseCurrency,
        rate,
      }),
      baseCurrency,
    });

    // Get all transactions for this account
    const transactionsData = await getTransactionsByAccountId(db, {
      accountId,
      teamId,
    });

    // Format transactions with base amounts
    const formattedTransactions = transactionsData.map((transaction) => {
      // Exclude fts_vector as it's a generated column
      const { ftsVector, ...tx } = transaction;
      return {
        ...tx,
        baseAmount: getTransactionAmount({
          amount: Number(transaction.amount),
          currency: transaction.currency,
          baseCurrency,
          rate,
        }),
        baseCurrency,
      };
    });

    // Bulk update transactions with base currency/amount
    await bulkUpdateTransactionsBaseCurrency(db, {
      transactions: formattedTransactions.map((tx) => ({
        id: tx.id,
        baseAmount: tx.baseAmount,
        baseCurrency: tx.baseCurrency,
      })),
      teamId,
    });

    this.logger.info("Update account base currency completed", {
      accountId,
      currency,
      baseCurrency,
      transactionCount: formattedTransactions.length,
    });
  }
}
