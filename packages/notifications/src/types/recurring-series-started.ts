import type { NotificationHandler } from "../base";
import { recurringSeriesStartedSchema } from "../schemas";

export const recurringSeriesStarted: NotificationHandler = {
  schema: recurringSeriesStartedSchema,

  createActivity: (data, user) => ({
    teamId: user.team_id,
    userId: user.id,
    type: "recurring_series_started",
    source: "system",
    priority: 3,
    metadata: {
      recordId: data.recurringId,
      invoiceId: data.invoiceId,
      invoiceNumber: data.invoiceNumber,
      customerName: data.customerName,
      frequency: data.frequency,
      endType: data.endType,
      endDate: data.endDate,
      endCount: data.endCount,
      userName: user.full_name,
    },
  }),
};
