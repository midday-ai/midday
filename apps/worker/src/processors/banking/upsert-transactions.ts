import { upsertTransactions } from "@midday/db/queries";
import { triggerJob } from "@midday/job-client";
import type { Job } from "bullmq";
import {
  type UpsertTransactionsPayload,
  upsertTransactionsSchema,
} from "../../schemas/banking";
import { getDb } from "../../utils/db";
import { BaseProcessor } from "../base";

/**
 * Transform a transaction from the banking API format to the DB format
 */
function transformTransaction(
  transaction: UpsertTransactionsPayload["transactions"][number],
  teamId: string,
  bankAccountId: string,
  notified?: boolean,
) {
  return {
    name: transaction.name,
    description: transaction.description,
    date: transaction.date,
    amount: transaction.amount,
    currency: transaction.currency,
    method: transaction.method as "other" | "card_purchase" | "transfer" | null,
    internalId: `${teamId}_${transaction.id}`,
    categorySlug: transaction.category,
    bankAccountId,
    balance: transaction.balance,
    teamId,
    counterpartyName: transaction.counterparty_name,
    merchantName: transaction.merchant_name,
    // Only support posted status for now
    status: "posted" as const,
    manual: false,
    // If manual sync, don't notify (user initiated)
    ...(notified !== undefined ? { notified } : {}),
  };
}

/**
 * Upserts a batch of transactions to the database.
 * After upsert, triggers embedding job for new transactions.
 */
export class UpsertTransactionsProcessor extends BaseProcessor<UpsertTransactionsPayload> {
  protected getPayloadSchema() {
    return upsertTransactionsSchema;
  }

  async process(job: Job<UpsertTransactionsPayload>): Promise<void> {
    const { transactions, teamId, bankAccountId, manualSync } = job.data;
    const db = getDb();

    this.logger.info("Upserting transactions", {
      teamId,
      bankAccountId,
      count: transactions.length,
    });

    // Transform transactions to DB format
    const formattedTransactions = transactions.map((transaction) =>
      transformTransaction(
        transaction,
        teamId,
        bankAccountId,
        manualSync, // notified = manualSync (don't notify on manual sync)
      ),
    );

    // Upsert transactions (ignoreDuplicates based on internal_id)
    const upsertedTransactions = await upsertTransactions(db, {
      transactions: formattedTransactions.map((tx) => ({
        ...tx,
        method: tx.method ?? "other",
        status: tx.status,
      })),
      teamId,
    });

    const transactionIds = upsertedTransactions.map((tx) => tx.id);

    this.logger.info("Transactions upserted", {
      teamId,
      bankAccountId,
      upsertedCount: transactionIds.length,
    });

    // Trigger embedding job for new transactions (non-blocking)
    if (transactionIds.length > 0) {
      await triggerJob(
        "embed-transaction",
        {
          transactionIds,
          teamId,
        },
        "transactions",
      );

      this.logger.info("Triggered transaction embedding", {
        transactionCount: transactionIds.length,
        teamId,
      });
    }
  }
}
