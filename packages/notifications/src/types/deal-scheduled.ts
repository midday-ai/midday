import type { NotificationHandler } from "../base";
import { dealScheduledSchema } from "../schemas";

export const dealScheduled: NotificationHandler = {
  schema: dealScheduledSchema,

  createActivity: (data, user) => ({
    teamId: user.team_id,
    userId: user.id,
    type: "deal_scheduled",
    source: "system",
    priority: 3,
    metadata: {
      recordId: data.dealId,
      dealNumber: data.dealNumber,
      merchantName: data.merchantName,
      scheduledAt: data.scheduledAt,
    },
  }),
};
