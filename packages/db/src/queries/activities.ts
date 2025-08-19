import type { Database } from "@db/client";
import { activities } from "@db/schema";
import type { activityStatusEnum, activityTypeEnum } from "@db/schema";
import { and, desc, eq, inArray, lte, ne } from "drizzle-orm";
import type { SQL } from "drizzle-orm/sql/sql";

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
