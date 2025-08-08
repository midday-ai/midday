import type { NotificationHandler } from "../base";
import { invoiceScheduledSchema } from "../schemas";

export const invoiceScheduled: NotificationHandler = {
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
      invoiceId: data.invoiceId,
      invoiceNumber: data.invoiceNumber,
      customerName: data.customerName,
      scheduledAt: data.scheduledAt,
      userName: user.user.full_name,
      teamName: user.team.name,
    },
  }),
};
