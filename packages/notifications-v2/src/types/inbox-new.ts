import type { NotificationHandler } from "../base";
import { type InboxNewInput, inboxNewSchema } from "../schemas";

export const inboxNew: NotificationHandler<InboxNewInput> = {
  schema: inboxNewSchema,
  activityType: "inbox_new",
  defaultPriority: 3,

  createActivity: (data, user) => {
    return {
      teamId: user.team_id,
      userId: user.user.id,
      type: "inbox_new",
      source: "system" as const,
      priority: 3,
      metadata: {
        totalCount: data.totalCount,
        source: data.source,
        syncType: data.syncType,
        provider: data.provider,
      },
    };
  },
};
