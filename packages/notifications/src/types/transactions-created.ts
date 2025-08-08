import { getInboxEmail } from "@midday/inbox";
import type { NotificationHandler } from "../base";
import { transactionsCreatedSchema } from "../schemas";

export const transactionsCreated: NotificationHandler = {
  schema: transactionsCreatedSchema,
  activityType: "transactions_created",
  defaultPriority: 3,
  email: {
    template: "transactions",
    subject: "transactions.subject",
  },

  createActivity: (data, user) => {
    const firstTransaction = data.transactions[0];
    const lastTransaction = data.transactions[data.transactions.length - 1];

    return {
      teamId: user.team_id,
      userId: user.id,
      type: "transactions_created",
      source: "system",
      priority: 3,
      metadata: {
        count: data.transactions.length,
        dateRange: {
          from: lastTransaction?.date,
          to: firstTransaction?.date,
        },
        // For single transactions, store the transaction details for richer notifications
        ...(data.transactions.length === 1 &&
          firstTransaction && {
            transaction: {
              name: firstTransaction.name,
              amount: firstTransaction.amount,
              currency: firstTransaction.currency,
              date: firstTransaction.date,
            },
          }),
      },
    };
  },

  createEmail: (data, user) => ({
    template: "transactions",
    subject: "transactions.subject",
    user,
    replyTo: getInboxEmail(user.team_inbox_id),
    data: {
      transactions: data.transactions,
      teamName: user.team_name,
    },
  }),
};
