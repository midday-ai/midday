import { getAppUrl } from "@midday/utils/envs";
import type { NotificationHandler } from "../base";
import { invoicePaidSchema } from "../schemas";

export const invoicePaid: NotificationHandler = {
  schema: invoicePaidSchema,
  activityType: "invoice_paid",
  defaultPriority: 2,
  email: {
    template: "invoice-paid",
    subject: "invoice.paid.subject",
  },

  createActivity: (data, user) => ({
    teamId: user.team_id,
    userId: user.id,
    type: "invoice_paid",
    source: data.source === "manual" ? "user" : "system",
    priority: 3,
    metadata: {
      invoiceId: data.invoiceId,
      invoiceNumber: data.invoiceNumber,
      customerName: data.customerName,
      paidAt: data.paidAt,
      source: data.source,
    },
  }),

  createEmail: (data, user) => ({
    template: "invoice-paid",
    subject: "invoice.paid.subject",
    user,
    data: {
      invoiceNumber: data.invoiceNumber,
      link: `${getAppUrl()}/invoices?invoiceId=${data.invoiceId}&type=details`,
    },
  }),
};
