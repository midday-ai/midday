import type { NotificationHandler } from "../base";
import { invoiceReminderSentSchema } from "../schemas";

export const invoiceReminderSent: NotificationHandler = {
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
      invoiceId: data.invoiceId,
      invoiceNumber: data.invoiceNumber,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      userName: user.user.full_name,
      teamName: user.team.name,
    },
  }),
};
