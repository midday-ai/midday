import type { NotificationHandler } from "../base";
import { inboxCrossCurrencyMatchedSchema } from "../schemas";

export const inboxCrossCurrencyMatched: NotificationHandler = {
  schema: inboxCrossCurrencyMatchedSchema,

  createActivity: (data, user) => ({
    teamId: user.team_id,
    userId: user.id,
    type: "inbox_cross_currency_matched",
    source: "system",
    priority: 2,
    metadata: {
      inboxId: data.inboxId,
      transactionId: data.transactionId,
      documentName: data.documentName,
      documentAmount: data.documentAmount,
      documentCurrency: data.documentCurrency,
      transactionAmount: data.transactionAmount,
      transactionCurrency: data.transactionCurrency,
      transactionName: data.transactionName,
      confidenceScore: data.confidenceScore,
      matchType: data.matchType,
    },
  }),
};
