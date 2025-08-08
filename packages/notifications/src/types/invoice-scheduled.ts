import { getAppUrl } from "@midday/utils/envs";
import type { NotificationHandler } from "../base";
import { type InvoiceScheduledInput, invoiceScheduledSchema } from "../schemas";

export const invoiceScheduled: NotificationHandler<InvoiceScheduledInput> = {
  schema: invoiceScheduledSchema,
  activityType: "invoice_scheduled",
  defaultPriority: 3,

  createActivity: (data, user) => ({
    teamId: user.team_id,
    userId: user.user.id,
    type: "invoice_scheduled",
    source: "system",
    priority: 3,
    metadata: {
      recordId: data.invoiceId,
      invoiceId: data.invoiceId,
      invoiceNumber: data.invoiceNumber,
      scheduledAt: data.scheduledAt,
      customerName: data.customerName,
      link: `${getAppUrl()}/invoices?invoiceId=${data.invoiceId}&type=details`,
      userName: user.user.full_name,
      teamName: user.team.name,
    },
  }),
};
