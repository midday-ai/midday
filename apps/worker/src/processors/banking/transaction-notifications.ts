import { markTransactionsNotified } from "@midday/db/queries";
import { Notifications } from "@midday/notifications";
import type { Job } from "bullmq";
import {
  type TransactionNotificationsPayload,
  transactionNotificationsSchema,
} from "../../schemas/banking";
import { getDb } from "../../utils/db";
import { BaseProcessor } from "../base";

/**
 * Sends notifications for new transactions.
 * Marks transactions as notified and sends email/push notifications.
 */
export class TransactionNotificationsProcessor extends BaseProcessor<TransactionNotificationsPayload> {
  protected getPayloadSchema() {
    return transactionNotificationsSchema;
  }

  async process(job: Job<TransactionNotificationsPayload>): Promise<void> {
    const { teamId } = job.data;
    const db = getDb();
    const notifications = new Notifications(db);

    this.logger.info("Processing transaction notifications", { teamId });

    // Mark transactions as notified and get them
    const transactionsData = await markTransactionsNotified(db, { teamId });

    if (!transactionsData || transactionsData.length === 0) {
      this.logger.info("No transactions to notify", { teamId });
      return;
    }

    // Sort by date descending
    const sortedTransactions = transactionsData.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    this.logger.info("Sending transaction notifications", {
      teamId,
      transactionCount: sortedTransactions.length,
    });

    // Create notification
    // ProviderNotificationService handles provider-specific notifications (Slack, etc.)
    await notifications.create(
      "transactions_created",
      teamId,
      {
        transactions: sortedTransactions.map((transaction) => ({
          id: transaction.id,
          date: transaction.date,
          amount: transaction.amount,
          name: transaction.name,
          currency: transaction.currency,
        })),
      },
      {
        sendEmail: true,
      },
    );

    this.logger.info("Transaction notifications sent", {
      teamId,
      transactionCount: sortedTransactions.length,
    });
  }
}
