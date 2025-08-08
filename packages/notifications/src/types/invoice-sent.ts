import { getAppUrl } from "@midday/utils/envs";
import type { NotificationHandler } from "../base";
import { type InvoiceSentInput, invoiceSentSchema } from "../schemas";

export const invoiceSent: NotificationHandler<InvoiceSentInput> = {
  schema: invoiceSentSchema,
  activityType: "invoice_sent",
  defaultPriority: 3,

  createActivity: (data, user) => ({
    teamId: user.team_id,
    userId: user.user.id,
    type: "invoice_sent",
    source: "system",
    priority: 3,
    metadata: {
      recordId: data.invoiceId,
      invoiceId: data.invoiceId,
      invoiceNumber: data.invoiceNumber,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      link: `${getAppUrl()}/invoices?invoiceId=${data.invoiceId}&type=details`,
      userName: user.user.full_name,
      teamName: user.team.name,
    },
  }),
};
