import { and, desc, eq, gte, inArray, lte, ne } from "drizzle-orm";
import type { SQL } from "drizzle-orm/sql/sql";
import type { Database, DatabaseOrTransaction } from "../client";
import type { activityStatusEnum, activityTypeEnum } from "../schema";
import { activities } from "../schema";

/**
 * Activity type returned from database queries
 * Uses Drizzle's inferred select type for type safety
 */
export type Activity = typeof activities.$inferSelect;

type CreateActivityParams = {
  teamId: string;
  userId?: string;
  type: (typeof activityTypeEnum.enumValues)[number];
  source: "system" | "user";
  status?: (typeof activityStatusEnum.enumValues)[number];
  priority?: number;
  groupId?: string;
  metadata: Record<string, any>;
};

export async function createActivity(
  db: DatabaseOrTransaction,
  params: CreateActivityParams,
) {
  const [result] = await db
    .insert(activities)
    .values({
      teamId: params.teamId,
      userId: params.userId,
      type: params.type,
      source: params.source,
      status: params.status,
      priority: params.priority ?? 5,
      groupId: params.groupId,
      metadata: params.metadata,
    })
    .returning();

  return result;
}

export async function updateActivityStatus(
  db: Database,
  activityId: string,
  status: (typeof activityStatusEnum.enumValues)[number],
  teamId: string,
) {
  const [result] = await db
    .update(activities)
    .set({ status })
    .where(and(eq(activities.id, activityId), eq(activities.teamId, teamId)))
    .returning();

  return result;
}

export async function updateAllActivitiesStatus(
  db: Database,
  teamId: string,
  status: (typeof activityStatusEnum.enumValues)[number],
  options: { userId: string },
) {
  const conditions = [
    eq(activities.teamId, teamId),
    eq(activities.userId, options.userId),
  ];

  // Only update specific statuses based on the target status
  if (status === "archived") {
    // When archiving, update unread and read notifications
    conditions.push(inArray(activities.status, ["unread", "read"]));
  } else if (status === "read") {
    // When marking as read, only update unread notifications (never archived)
    conditions.push(eq(activities.status, "unread"));
  } else {
    // For other statuses, use the original logic but exclude archived
    conditions.push(ne(activities.status, status));
    conditions.push(ne(activities.status, "archived"));
  }

  const result = await db
    .update(activities)
    .set({ status })
    .where(and(...conditions))
    .returning();

  return result;
}

export type GetActivitiesParams = {
  teamId: string;
  cursor?: string | null;
  pageSize?: number;
  status?:
    | (typeof activityStatusEnum.enumValues)[number][]
    | (typeof activityStatusEnum.enumValues)[number]
    | null;
  userId?: string | null;
  priority?: number | null;
  maxPriority?: number | null; // For filtering notifications (priority <= 3)
  createdAfter?: string | null; // ISO timestamp to filter activities created after this time
};

export async function getActivities(db: Database, params: GetActivitiesParams) {
  const {
    teamId,
    cursor,
    pageSize = 20,
    status,
    userId,
    priority,
    maxPriority,
    createdAfter,
  } = params;

  // Convert cursor to offset
  const offset = cursor ? Number.parseInt(cursor, 10) : 0;

  // Base conditions for the WHERE clause
  const whereConditions: SQL[] = [eq(activities.teamId, teamId)];

  // Filter by status - support both single status and array of statuses
  if (status) {
    if (Array.isArray(status)) {
      whereConditions.push(inArray(activities.status, status));
    } else {
      whereConditions.push(eq(activities.status, status));
    }
  }

  // Filter by user if specified
  if (userId) {
    whereConditions.push(eq(activities.userId, userId));
  }

  // Filter by priority if specified
  if (priority) {
    whereConditions.push(eq(activities.priority, priority));
  }

  // Filter by max priority if specified (for notifications: priority <= 3)
  if (maxPriority) {
    whereConditions.push(lte(activities.priority, maxPriority));
  }

  // Filter by creation time if specified
  if (createdAfter) {
    whereConditions.push(gte(activities.createdAt, createdAfter));
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

export type FindRecentInboxNewActivityParams = {
  teamId: string;
  userId?: string;
  timeWindowMinutes?: number;
};

/**
 * Find the most recent unread inbox_new activity for a team/user within a time window
 * Used to combine multiple inbox_new notifications into a single one
 * @deprecated Use findRecentActivity instead
 */
export async function findRecentInboxNewActivity(
  db: Database,
  params: FindRecentInboxNewActivityParams,
) {
  return findRecentActivity(db, {
    ...params,
    type: "inbox_new",
  });
}

export type FindRecentActivityParams = {
  teamId: string;
  userId?: string;
  type: (typeof activityTypeEnum.enumValues)[number];
  timeWindowMinutes?: number;
};

/**
 * Find the most recent unread activity of a specific type for a team/user within a time window
 * Used to combine multiple notifications of the same type into a single one
 */
export async function findRecentActivity(
  db: Database,
  params: FindRecentActivityParams,
) {
  const { teamId, userId, type, timeWindowMinutes = 5 } = params;

  const timeWindowAgo = new Date(
    Date.now() - timeWindowMinutes * 60 * 1000,
  ).toISOString();

  const conditions: SQL[] = [
    eq(activities.teamId, teamId),
    eq(activities.type, type as any),
    eq(activities.status, "unread"),
    gte(activities.createdAt, timeWindowAgo),
  ];

  if (userId) {
    conditions.push(eq(activities.userId, userId));
  }

  const [result] = await db
    .select()
    .from(activities)
    .where(and(...conditions))
    .orderBy(desc(activities.createdAt))
    .limit(1);

  return result ?? null;
}

export type UpdateActivityMetadataParams = {
  activityId: string;
  teamId: string;
  metadata: Record<string, any>;
};

/**
 * Update the metadata field of an activity
 * Used to combine notifications by updating their metadata
 */
export async function updateActivityMetadata(
  db: Database,
  params: UpdateActivityMetadataParams,
) {
  const { activityId, teamId, metadata } = params;

  const [result] = await db
    .update(activities)
    .set({
      metadata: metadata as any,
      createdAt: new Date().toISOString(), // Refresh timestamp to show it's updated
    })
    .where(and(eq(activities.id, activityId), eq(activities.teamId, teamId)))
    .returning();

  return result ?? null;
}
