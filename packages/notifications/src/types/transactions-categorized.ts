import type { NotificationHandler } from "../base";
import { transactionsCategorizedSchema } from "../schemas";

export const transactionsCategorized: NotificationHandler = {
  schema: transactionsCategorizedSchema,

  createActivity: (data, user) => ({
    teamId: user.team_id,
    userId: user.id,
    type: "transactions_categorized",
    source: "user",
    priority: 7,
    metadata: {
      categorySlug: data.categorySlug,
      transactionIds: data.transactionIds,
      transactionCount: data.transactionIds.length,
    },
  }),
};
