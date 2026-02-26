import type { NotificationHandler } from "../base";
import { dealCreatedSchema } from "../schemas";

export const dealCreated: NotificationHandler = {
  schema: dealCreatedSchema,

  createActivity: (data, user) => ({
    teamId: user.team_id,
    userId: user.id,
    type: "deal_created",
    source: "user",
    priority: 3,
    metadata: {
      recordId: data.dealId,
      dealNumber: data.dealNumber,
      merchantName: data.merchantName,
      amount: data.amount,
      currency: data.currency,
      userName: user.full_name,
    },
  }),
};
