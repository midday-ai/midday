import type { NotificationHandler } from "../base";
import { eInvoiceSentSchema } from "../schemas";

export const eInvoiceSent: NotificationHandler = {
  schema: eInvoiceSentSchema,

  createActivity: (data, user) => ({
    teamId: user.team_id,
    userId: user.id,
    type: "e_invoice_sent",
    source: "system",
    priority: 3,
    metadata: {
      recordId: data.invoiceId,
      invoiceNumber: data.invoiceNumber,
      customerName: data.customerName,
    },
  }),
};
