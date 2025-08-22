import type { NotificationHandler } from "../base";
import { transactionsExportedSchema } from "../schemas";

export const transactionsExported: NotificationHandler = {
  schema: transactionsExportedSchema,

  createActivity: (data, user) => ({
    teamId: user.team_id,
    type: "transactions_exported",
    source: "system",
    priority: 7,
    metadata: {
      transactionIds: data.transactionIds,
      transactionCount: data.transactionCount,
      locale: data.locale,
      dateFormat: data.dateFormat,
    },
  }),
};
