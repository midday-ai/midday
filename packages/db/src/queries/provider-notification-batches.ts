import { and, eq, isNull, lte, sql } from "drizzle-orm";
import type { Database } from "../client";
import { providerNotificationBatches } from "../schema";

type BatchPayload = {
  entries: Array<Record<string, unknown>>;
};

export async function queueProviderNotificationBatch(
  db: Database,
  params: {
    batchKey: string;
    platformIdentityId: string;
    teamId: string;
    userId: string;
    provider: "slack" | "telegram" | "whatsapp" | "sendblue";
    eventFamily: string;
    entry: Record<string, unknown>;
    notificationContext?: Record<string, unknown> | null;
    windowEndsAt: string;
  },
) {
  const existing = await getQueuedProviderNotificationBatch(
    db,
    params.batchKey,
  );

  if (existing && !existing.sentAt) {
    const existingPayload = (existing.payload as BatchPayload | null) ?? {
      entries: [],
    };

    const [updated] = await db
      .update(providerNotificationBatches)
      .set({
        payload: {
          entries: [...(existingPayload.entries ?? []), params.entry],
        },
        notificationContext:
          params.notificationContext ?? existing.notificationContext,
        updatedAt: sql`now()`,
      })
      .where(eq(providerNotificationBatches.id, existing.id))
      .returning();

    return updated ?? existing;
  }

  const [created] = await db
    .insert(providerNotificationBatches)
    .values({
      batchKey: params.batchKey,
      platformIdentityId: params.platformIdentityId,
      teamId: params.teamId,
      userId: params.userId,
      provider: params.provider,
      eventFamily: params.eventFamily,
      payload: { entries: [params.entry] },
      notificationContext: params.notificationContext ?? null,
      windowEndsAt: params.windowEndsAt,
    })
    .returning();

  return created!;
}

export async function getQueuedProviderNotificationBatch(
  db: Database,
  batchKey: string,
) {
  const [result] = await db
    .select()
    .from(providerNotificationBatches)
    .where(
      and(
        eq(providerNotificationBatches.batchKey, batchKey),
        isNull(providerNotificationBatches.sentAt),
      ),
    )
    .limit(1);

  return result ?? null;
}

export async function listDueProviderNotificationBatches(
  db: Database,
  limit = 100,
) {
  return db
    .select()
    .from(providerNotificationBatches)
    .where(
      and(
        isNull(providerNotificationBatches.sentAt),
        lte(providerNotificationBatches.windowEndsAt, sql`now()`),
      ),
    )
    .limit(limit);
}

export async function markProviderNotificationBatchSent(
  db: Database,
  params: {
    id: string;
    notificationContext?: Record<string, unknown> | null;
  },
) {
  const [updated] = await db
    .update(providerNotificationBatches)
    .set({
      sentAt: sql`now()`,
      notificationContext: params.notificationContext ?? null,
      updatedAt: sql`now()`,
    })
    .where(eq(providerNotificationBatches.id, params.id))
    .returning();

  return updated ?? null;
}
