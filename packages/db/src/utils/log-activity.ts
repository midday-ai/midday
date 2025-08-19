import type { Database } from "@db/client";
import { createActivity } from "../queries/activities";
import type { activityTypeEnum } from "../schema";

type ActivityType = (typeof activityTypeEnum.enumValues)[number];

interface LogActivityOptions {
  db: Database;
  teamId: string;
  userId: string;
  type: ActivityType;
  metadata: Record<string, any>;
  priority?: number;
  status?: "unread" | "read" | "archived";
  source?: "user" | "system";
}

// Simple activity logging with sensible defaults
export function logActivity(options: LogActivityOptions) {
  try {
    // Don't await - fire and forget
    createActivity(options.db, {
      teamId: options.teamId,
      userId: options.userId,
      type: options.type,
      source: options.source ?? "user",
      status: options.status ?? "read",
      priority: options.priority ?? 7,
      metadata: options.metadata,
    }).catch(() => {
      // Silent fail - never break main operations
    });
  } catch {
    // Even if the call itself throws, ignore it
  }
}
