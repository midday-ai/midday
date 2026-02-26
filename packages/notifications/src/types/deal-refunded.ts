import type { NotificationHandler } from "../base";
import { dealRefundedSchema } from "../schemas";

export const dealRefunded: NotificationHandler = {
  schema: dealRefundedSchema,

  createActivity: (data, user) => ({
    teamId: user.team_id,
    userId: user.id,
    type: "deal_refunded",
    source: "system",
    priority: 2, // High priority - refunds are important
    metadata: {
      recordId: data.dealId,
      dealNumber: data.dealNumber,
      merchantName: data.merchantName,
      refundedAt: data.refundedAt,
    },
  }),
};
