import type { NotificationHandler } from "../base";
import { recurringSeriesPausedSchema } from "../schemas";

export const recurringSeriesPaused: NotificationHandler = {
  schema: recurringSeriesPausedSchema,

  createActivity: (data, user) => ({
    teamId: user.team_id,
    userId: user.id,
    type: "recurring_series_paused",
    source: "system",
    priority: 4, // Slightly higher priority since it might need attention
    metadata: {
      recordId: data.recurringId,
      customerName: data.customerName,
      reason: data.reason,
      failureCount: data.failureCount,
      userName: user.full_name,
    },
  }),
};
