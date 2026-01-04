import type { NotificationHandler } from "../base";
import { recurringInvoiceUpcomingSchema } from "../schemas";

export const recurringInvoiceUpcoming: NotificationHandler = {
  schema: recurringInvoiceUpcomingSchema,

  createActivity: (data, user) => ({
    teamId: user.team_id,
    userId: user.id,
    type: "recurring_invoice_upcoming",
    source: "system",
    priority: 4, // Medium-high priority - actionable notification
    metadata: {
      recordId: data.recurringId,
      customerName: data.customerName,
      amount: data.amount,
      currency: data.currency,
      scheduledAt: data.scheduledAt,
      frequency: data.frequency,
    },
  }),
};
