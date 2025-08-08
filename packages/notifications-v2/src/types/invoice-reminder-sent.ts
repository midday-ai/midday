import { getAppUrl } from "@midday/utils/envs";
import type { NotificationHandler } from "../base";
import {
  type InvoiceReminderSentInput,
  invoiceReminderSentSchema,
} from "../schemas";

export const invoiceReminderSent: NotificationHandler<InvoiceReminderSentInput> =
  {
    schema: invoiceReminderSentSchema,
    activityType: "invoice_reminder_sent",
    defaultPriority: 3,

    createActivity: (data, user) => ({
      teamId: user.team_id,
      userId: user.user.id,
      type: "invoice_reminder_sent",
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
