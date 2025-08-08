import { getAppUrl } from "@midday/utils/envs";
import type { NotificationHandler } from "../base";
import { invoiceOverdueSchema } from "../schemas";

export const invoiceOverdue: NotificationHandler = {
  schema: invoiceOverdueSchema,
  activityType: "invoice_overdue",
  defaultPriority: 2,
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
      invoiceId: data.invoiceId,
      invoiceNumber: data.invoiceNumber,
      customerName: data.customerName,
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
