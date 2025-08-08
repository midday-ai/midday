import { getAppUrl } from "@midday/utils/envs";
import type { NotificationHandler } from "../base";
import { type InvoiceCreatedInput, invoiceCreatedSchema } from "../schemas";

export const invoiceCreated: NotificationHandler<InvoiceCreatedInput> = {
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
      recordId: data.invoiceId,
      invoiceId: data.invoiceId,
      invoiceNumber: data.invoiceNumber,
      customerName: data.customerName,
      amount: data.amount,
      currency: data.currency,
      link: `${getAppUrl()}/invoices?invoiceId=${data.invoiceId}&type=details`,
      userName: user.user.full_name,
      teamName: user.team.name,
    },
  }),
};
