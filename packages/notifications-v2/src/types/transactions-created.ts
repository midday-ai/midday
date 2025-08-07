import { getInboxEmail } from "@midday/inbox";
import type { NotificationHandler } from "../base";
import {
  type TransactionsCreatedInput,
  transactionsCreatedSchema,
} from "../schemas";

export const transactionsCreated: NotificationHandler<TransactionsCreatedInput> =
  {
    schema: transactionsCreatedSchema,
    activityType: "transactions_created",
    defaultPriority: 3,
    email: {
      template: "transactions",
      subject: "transactions.subject",
    },

    createActivity: (data, user) => ({
      teamId: user.team_id,
      userId: user.user.id,
      type: "transactions_created",
      source: "system",
      priority: 3,
      metadata: {
        transactions: data.transactions.map((t) => ({
          id: t.id,
          name: t.name,
          amount: t.amount,
          currency: t.currency,
          date: t.date,
          category: t.category,
        })),
        count: data.transactions.length,
        dateRange: {
          from: data.transactions[data.transactions.length - 1]?.date,
          to: data.transactions[0]?.date,
        },
        userName: user.user.full_name,
        teamName: user.team.name,
      },
    }),

    createEmail: (data, user) => ({
      template: "transactions",
      subject: "transactions.subject",
      user,
      replyTo: getInboxEmail(user.team.inbox_id),
      data: {
        transactions: data.transactions,
        teamName: user.team.name,
      },
    }),
  };
