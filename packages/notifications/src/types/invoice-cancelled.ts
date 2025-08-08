import { getAppUrl } from "@midday/utils/envs";
import type { NotificationHandler } from "../base";
import { type InvoiceCancelledInput, invoiceCancelledSchema } from "../schemas";

export const invoiceCancelled: NotificationHandler<InvoiceCancelledInput> = {
  schema: invoiceCancelledSchema,
  activityType: "invoice_cancelled",
  defaultPriority: 3,

  createActivity: (data, user) => ({
    teamId: user.team_id,
    userId: user.user.id,
    type: "invoice_cancelled",
    source: "user",
    priority: 3,
    metadata: {
      recordId: data.invoiceId,
      invoiceId: data.invoiceId,
      invoiceNumber: data.invoiceNumber,
      customerName: data.customerName,
      link: `${getAppUrl()}/invoices?invoiceId=${data.invoiceId}&type=details`,
      userName: user.user.full_name,
      teamName: user.team.name,
    },
  }),
};
