import type { Database } from "@midday/db/client";
import { type Activity, findRecentActivity } from "@midday/db/queries";
import type { NotificationHandler, UserData } from "../base";
import { type InboxNewInput, inboxNewSchema } from "../schemas";

export const inboxNew: NotificationHandler<InboxNewInput> = {
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
      type: data.inboxType,
      provider: data.provider,
    },
  }),

  combine: {
    findExisting: async (
      db: Database,
      _data: InboxNewInput,
      user: UserData,
    ): Promise<Activity | null> => {
      return findRecentActivity(db, {
        teamId: user.team_id,
        userId: user.id,
        type: "inbox_new",
        timeWindowMinutes: 5,
      });
    },
    mergeMetadata: (existing, incoming) => {
      return {
        ...existing,
        totalCount: (existing.totalCount ?? 0) + (incoming.totalCount ?? 0),
        // Prefer newer values for source, type, provider
        source: incoming.source ?? existing.source,
        type: incoming.type ?? existing.type,
        provider: incoming.provider ?? existing.provider,
      };
    },
  },
};
