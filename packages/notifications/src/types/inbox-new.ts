import type { NotificationHandler } from "../base";
import { inboxNewSchema } from "../schemas";

export const inboxNew: NotificationHandler = {
  schema: inboxNewSchema,

  createActivity: (data, user) => ({
    teamId: user.team_id,
    userId: user.id,
    type: "inbox_new",
    source: "system",
    priority: 3,
    metadata: {
      totalCount: data.totalCount,
      source: data.source,
      syncType: data.syncType,
      provider: data.provider,
    },
  }),
};
