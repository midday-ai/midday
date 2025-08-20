import type { NotificationHandler } from "../base";
import { invoiceScheduledSchema } from "../schemas";

export const invoiceScheduled: NotificationHandler = {
  schema: invoiceScheduledSchema,

  createActivity: (data, user) => ({
    teamId: user.team_id,
    userId: user.id,
    type: "invoice_scheduled",
    source: "system",
    priority: 3,
    metadata: {
      recordId: data.invoiceId,
      invoiceNumber: data.invoiceNumber,
      customerName: data.customerName,
      scheduledAt: data.scheduledAt,
    },
  }),
};
