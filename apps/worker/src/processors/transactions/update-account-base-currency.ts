import { getExchangeRate } from "@midday/db/queries";
import { bankAccounts, transactions } from "@midday/db/schema";
import type { Job } from "bullmq";
import { eq, sql } from "drizzle-orm";
import type { UpdateAccountBaseCurrencyPayload } from "../../schemas/transactions";
import {
  getAccountBalance,
  getTransactionAmount,
} from "../../utils/base-currency";
import { getDb } from "../../utils/db";
import { processBatch } from "../../utils/process-batch";
import { BaseProcessor } from "../base";

const BATCH_LIMIT = 500;

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

    await this.updateProgress(job, 10);

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

    await this.updateProgress(job, 20);

    // Update account base balance and base currency
    await db
      .update(bankAccounts)
      .set({
        baseBalance: getAccountBalance({
          currency,
          balance,
          baseCurrency,
          rate,
        }),
        baseCurrency,
      })
      .where(eq(bankAccounts.id, accountId));

    await this.updateProgress(job, 40);

    // Get all transactions for this account
    const transactionsData = await db
      .select()
      .from(transactions)
      .where(eq(transactions.bankAccountId, accountId));

    await this.updateProgress(job, 60);

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

    await this.updateProgress(job, 80);

    // Upsert transactions in batches
    await processBatch(formattedTransactions, BATCH_LIMIT, async (batch) => {
      await db
        .insert(transactions)
        .values(batch)
        .onConflictDoUpdate({
          target: [transactions.internalId],
          set: {
            baseAmount: sql`excluded.base_amount`,
            baseCurrency: sql`excluded.base_currency`,
          },
        });

      return batch;
    });

    await this.updateProgress(job, 100);

    this.logger.info("Update account base currency completed", {
      accountId,
      currency,
      baseCurrency,
      transactionCount: formattedTransactions.length,
    });
  }
}
