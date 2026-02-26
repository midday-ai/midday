import type { NotificationHandler } from "../base";
import { recurringSeriesCompletedSchema } from "../schemas";

export const recurringSeriesCompleted: NotificationHandler = {
  schema: recurringSeriesCompletedSchema,

  createActivity: (data, user) => ({
    teamId: user.team_id,
    userId: user.id,
    type: "recurring_series_completed",
    source: "system",
    priority: 3,
    metadata: {
      recordId: data.recurringId,
      dealId: data.dealId,
      dealNumber: data.dealNumber,
      merchantName: data.merchantName,
      totalGenerated: data.totalGenerated,
      userName: user.full_name,
    },
  }),
};

