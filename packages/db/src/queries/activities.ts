import type { Database } from "@db/client";
import { activities } from "@db/schema";
import type { activityTypeEnum } from "@db/schema";
import { and, desc, eq, isNotNull, isNull } from "drizzle-orm";
import type { SQL } from "drizzle-orm/sql/sql";

type CreateActivityParams = {
  teamId: string;
  userId?: string;
  type: (typeof activityTypeEnum.enumValues)[number];
  source: "system" | "user";
  priority?: number;
  metadata: Record<string, any>;
};

export async function createActivity(
  db: Database,
  params: CreateActivityParams,
) {
  const [result] = await db
    .insert(activities)
    .values({
      teamId: params.teamId,
      userId: params.userId,
      type: params.type,
      source: params.source,
      priority: params.priority ?? 5,
      metadata: params.metadata,
    })
    .returning();

  return result;
}

export async function markActivityAsRead(db: Database, activityId: string) {
  const [result] = await db
    .update(activities)
    .set({ readAt: new Date().toISOString() })
    .where(eq(activities.id, activityId))
    .returning();

  return result;
}

export async function markAllActivitiesAsRead(
  db: Database,
  teamId: string,
  options?: { userId?: string },
) {
  const conditions = [eq(activities.teamId, teamId)];

  if (options?.userId) {
    conditions.push(eq(activities.userId, options.userId));
  }

  const result = await db
    .update(activities)
    .set({ readAt: new Date().toISOString() })
    .where(and(...conditions))
    .returning();

  return result;
}

export type GetActivitiesParams = {
  teamId: string;
  cursor?: string | null;
  pageSize?: number;
  archived?: boolean | null; // null = all, true = archived (read), false = unarchived (unread)
  userId?: string | null;
  priority?: number | null;
};

export async function getActivities(db: Database, params: GetActivitiesParams) {
  const { teamId, cursor, pageSize = 20, archived, userId, priority } = params;

  // Convert cursor to offset
  const offset = cursor ? Number.parseInt(cursor, 10) : 0;

  // Base conditions for the WHERE clause
  const whereConditions: SQL[] = [eq(activities.teamId, teamId)];

  // Filter by archived status (readAt field)
  if (archived === true) {
    // Show only read activities (archived)
    whereConditions.push(isNotNull(activities.readAt));
  } else if (archived === false) {
    // Show only unread activities (not archived)
    whereConditions.push(isNull(activities.readAt));
  }
  // If archived is null, show all activities

  // Filter by user if specified
  if (userId) {
    whereConditions.push(eq(activities.userId, userId));
  }

  // Filter by priority if specified
  if (priority) {
    whereConditions.push(eq(activities.priority, priority));
  }

  // Execute the query with proper ordering and pagination
  const data = await db
    .select()
    .from(activities)
    .where(and(...whereConditions))
    .orderBy(desc(activities.createdAt)) // Most recent first
    .limit(pageSize)
    .offset(offset);

  // Calculate next cursor
  const nextCursor =
    data && data.length === pageSize
      ? (offset + pageSize).toString()
      : undefined;

  return {
    meta: {
      cursor: nextCursor ?? null,
      hasPreviousPage: offset > 0,
      hasNextPage: data && data.length === pageSize,
    },
    data,
  };
}
