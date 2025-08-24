import type { NotificationHandler } from "../base";
import { inboxAutoMatchedSchema } from "../schemas";

export const inboxAutoMatched: NotificationHandler = {
  schema: inboxAutoMatchedSchema,

  createActivity: (data, user) => ({
    teamId: user.team_id,
    userId: user.id,
    type: "inbox_auto_matched",
    source: "system",
    priority: 3,
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
      isCrossCurrency: data.isCrossCurrency || false,
    },
  }),
};
