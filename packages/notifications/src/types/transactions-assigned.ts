import type { NotificationHandler } from "../base";
import { transactionsAssignedSchema } from "../schemas";

export const transactionsAssigned: NotificationHandler = {
  schema: transactionsAssignedSchema,

  createActivity: (data, user) => ({
    teamId: user.team_id,
    userId: user.id,
    type: "transactions_assigned",
    source: "user",
    priority: 7,
    metadata: {
      assignedUserId: data.assignedUserId,
      transactionIds: data.transactionIds,
      transactionCount: data.transactionIds.length,
    },
  }),
};
