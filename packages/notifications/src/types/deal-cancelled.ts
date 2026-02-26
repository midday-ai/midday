import type { NotificationHandler } from "../base";
import { dealCancelledSchema } from "../schemas";

export const dealCancelled: NotificationHandler = {
  schema: dealCancelledSchema,

  createActivity: (data, user) => ({
    teamId: user.team_id,
    userId: user.id,
    type: "deal_cancelled",
    source: "user",
    priority: 3,
    metadata: {
      recordId: data.dealId,
      dealNumber: data.dealNumber,
      merchantName: data.merchantName,
      userName: user.full_name,
    },
  }),
};
