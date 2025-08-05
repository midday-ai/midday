import type { Database } from "@db/client";
import { activities } from "@db/schema";
import { and, eq } from "drizzle-orm";

type CreateActivityParams = {
  teamId: string;
  userId?: string;
  type: "transactions_created" | "transactions_enriched";
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
