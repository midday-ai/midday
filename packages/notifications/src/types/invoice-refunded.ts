import type { NotificationHandler } from "../base";
import { invoiceRefundedSchema } from "../schemas";

export const invoiceRefunded: NotificationHandler = {
  schema: invoiceRefundedSchema,

  createActivity: (data, user) => ({
    teamId: user.team_id,
    userId: user.id,
    type: "invoice_refunded",
    source: "system",
    priority: 2, // High priority - refunds are important
    metadata: {
      recordId: data.invoiceId,
      invoiceNumber: data.invoiceNumber,
      customerName: data.customerName,
      refundedAt: data.refundedAt,
    },
  }),
};
