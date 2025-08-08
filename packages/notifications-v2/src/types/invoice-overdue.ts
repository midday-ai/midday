import { getAppUrl } from "@midday/utils/envs";
import type { NotificationHandler } from "../base";
import { type InvoiceOverdueInput, invoiceOverdueSchema } from "../schemas";

export const invoiceOverdue: NotificationHandler<InvoiceOverdueInput> = {
  schema: invoiceOverdueSchema,
  activityType: "invoice_overdue",
  defaultPriority: 3,
  email: {
    template: "invoice-overdue",
    subject: "invoice.overdue.subject",
  },

  createActivity: (data, user) => ({
    teamId: user.team_id,
    userId: user.user.id,
    type: "invoice_overdue",
    source: "system",
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

  createEmail: (data, user) => ({
    template: "invoice-overdue",
    subject: "invoice.overdue.subject",
    user,
    data: {
      invoiceNumber: data.invoiceNumber,
      customerName: data.customerName,
      link: `${getAppUrl()}/invoices?invoiceId=${data.invoiceId}&type=details`,
    },
  }),
};
