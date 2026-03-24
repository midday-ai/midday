import type { NotificationHandler } from "../base";
import { invoiceCancelledSchema } from "../schemas";

export const invoiceCancelled: NotificationHandler = {
  schema: invoiceCancelledSchema,

  createActivity: (data, user) => ({
    teamId: user.team_id,
    userId: user.id,
    type: "invoice_cancelled",
    source: "user",
    priority: 3,
    metadata: {
      recordId: data.invoiceId,
      invoiceNumber: data.invoiceNumber,
      customerName: data.customerName,
      userName: user.full_name,
    },
  }),
};
