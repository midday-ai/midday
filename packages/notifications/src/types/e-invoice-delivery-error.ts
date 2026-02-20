import type { NotificationHandler } from "../base";
import { eInvoiceDeliveryErrorSchema } from "../schemas";

export const eInvoiceDeliveryError: NotificationHandler = {
  schema: eInvoiceDeliveryErrorSchema,

  createActivity: (data, user) => ({
    teamId: user.team_id,
    userId: user.id,
    type: "e_invoice_error",
    source: "system",
    priority: 2,
    metadata: {
      recordId: data.invoiceId,
      invoiceNumber: data.invoiceNumber,
      customerName: data.customerName,
      errorMessage: data.errorMessage,
    },
  }),
};
