import type { NotificationHandler } from "../base";
import { eInvoiceReceivedSchema } from "../schemas";

export const eInvoiceReceived: NotificationHandler = {
  schema: eInvoiceReceivedSchema,

  createActivity: (data, user) => ({
    teamId: user.team_id,
    userId: user.id,
    type: "e_invoice_received",
    source: "system",
    priority: 3,
    metadata: {
      supplierName: data.supplierName,
      invoiceNumber: data.invoiceNumber,
      amount: data.amount,
      currency: data.currency,
    },
  }),
};
