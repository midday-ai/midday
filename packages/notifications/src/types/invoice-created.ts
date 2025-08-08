import type { NotificationHandler } from "../base";
import { invoiceCreatedSchema } from "../schemas";

export const invoiceCreated: NotificationHandler = {
  schema: invoiceCreatedSchema,
  activityType: "invoice_created",
  defaultPriority: 3,

  createActivity: (data, user) => ({
    teamId: user.team_id,
    userId: user.user.id,
    type: "invoice_created",
    source: "user",
    priority: 3,
    metadata: {
      invoiceId: data.invoiceId,
      invoiceNumber: data.invoiceNumber,
      customerName: data.customerName,
      amount: data.amount,
      currency: data.currency,
      userName: user.user.full_name,
      teamName: user.team.name,
    },
  }),
};
