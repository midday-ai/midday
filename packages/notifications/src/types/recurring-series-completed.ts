import type { NotificationHandler } from "../base";
import { recurringSeriesCompletedSchema } from "../schemas";

export const recurringSeriesCompleted: NotificationHandler = {
  schema: recurringSeriesCompletedSchema,

  createActivity: (data, user) => ({
    teamId: user.team_id,
    userId: user.id,
    type: "recurring_series_completed",
    source: "system",
    priority: 3,
    metadata: {
      recordId: data.recurringId,
      invoiceId: data.invoiceId,
      invoiceNumber: data.invoiceNumber,
      customerName: data.customerName,
      totalGenerated: data.totalGenerated,
      userName: user.full_name,
    },
  }),
};
