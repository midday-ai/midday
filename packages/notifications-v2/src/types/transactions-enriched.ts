import { z } from "zod";
import {
  type NotificationHandler,
  transactionSchema,
  userSchema,
} from "../base";

const schema = z.object({
  users: z.array(userSchema),
  transactions: z.array(transactionSchema),
});

export const transactionsEnriched: NotificationHandler<z.infer<typeof schema>> =
  {
    schema,
    activityType: "transactions_enriched",
    defaultPriority: 6,
    createActivity: (data, user) => ({
      teamId: user.team_id,
      userId: user.user.id,
      source: "system",
      type: "transactions_enriched",
      priority: 6,
      metadata: {
        enrichmentCount: data.transactions.length,
        categories: data.transactions
          .map((t) => t.category)
          .filter(Boolean)
          .filter((category, index, self) => self.indexOf(category) === index),
        transactionIds: data.transactions.map((t) => t.id),
        userName: user.user.full_name,
        teamName: user.team.name,
      },
    }),
  };

export type TransactionsEnrichedInput = z.infer<typeof schema>;
