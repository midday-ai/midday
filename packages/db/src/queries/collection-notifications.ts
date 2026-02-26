import type { Database } from "@db/client";
import { collectionNotifications } from "@db/schema";
import { and, desc, eq, isNull, sql } from "drizzle-orm";

// ============================================================================
// Collection Notifications Queries
// ============================================================================

type GetUnreadNotificationsParams = {
  userId: string;
  teamId: string;
};

export const getUnreadNotifications = async (
  db: Database,
  params: GetUnreadNotificationsParams,
) => {
  return db
    .select()
    .from(collectionNotifications)
    .where(
      and(
        eq(collectionNotifications.userId, params.userId),
        eq(collectionNotifications.teamId, params.teamId),
        isNull(collectionNotifications.readAt),
      ),
    )
    .orderBy(desc(collectionNotifications.createdAt));
};

type GetNotificationCountParams = {
  userId: string;
  teamId: string;
};

export const getNotificationCount = async (
  db: Database,
  params: GetNotificationCountParams,
) => {
  const [result] = await db
    .select({
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(collectionNotifications)
    .where(
      and(
        eq(collectionNotifications.userId, params.userId),
        eq(collectionNotifications.teamId, params.teamId),
        isNull(collectionNotifications.readAt),
      ),
    );

  return result?.count ?? 0;
};

// ============================================================================
// Collection Notifications Mutations
// ============================================================================

type CreateNotificationParams = {
  teamId: string;
  userId: string;
  caseId: string;
  type: string;
  message: string;
};

export const createNotification = async (
  db: Database,
  params: CreateNotificationParams,
) => {
  const [result] = await db
    .insert(collectionNotifications)
    .values({
      teamId: params.teamId,
      userId: params.userId,
      caseId: params.caseId,
      type: params.type as (typeof collectionNotifications.type.enumValues)[number],
      message: params.message,
    })
    .returning();

  return result;
};

type MarkNotificationReadParams = {
  id: string;
  userId: string;
};

export const markNotificationRead = async (
  db: Database,
  params: MarkNotificationReadParams,
) => {
  const [result] = await db
    .update(collectionNotifications)
    .set({ readAt: new Date().toISOString() })
    .where(
      and(
        eq(collectionNotifications.id, params.id),
        eq(collectionNotifications.userId, params.userId),
      ),
    )
    .returning();

  return result;
};

type MarkAllNotificationsReadParams = {
  userId: string;
  teamId: string;
};

export const markAllNotificationsRead = async (
  db: Database,
  params: MarkAllNotificationsReadParams,
) => {
  await db
    .update(collectionNotifications)
    .set({ readAt: new Date().toISOString() })
    .where(
      and(
        eq(collectionNotifications.userId, params.userId),
        eq(collectionNotifications.teamId, params.teamId),
        isNull(collectionNotifications.readAt),
      ),
    );
};
