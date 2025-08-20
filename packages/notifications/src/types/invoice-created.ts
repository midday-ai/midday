import type { NotificationHandler } from "../base";
import { invoiceCreatedSchema } from "../schemas";

export const invoiceCreated: NotificationHandler = {
  schema: invoiceCreatedSchema,

  createActivity: (data, user) => ({
    teamId: user.team_id,
    userId: user.id,
    type: "invoice_created",
    source: "user",
    priority: 3,
    metadata: {
      recordId: data.invoiceId,
      invoiceNumber: data.invoiceNumber,
      customerName: data.customerName,
      amount: data.amount,
      currency: data.currency,
      userName: user.full_name,
    },
  }),
};
