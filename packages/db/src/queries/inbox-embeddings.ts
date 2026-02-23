import { and, eq, inArray } from "drizzle-orm";
import type { Database } from "../client";
import { inbox, inboxEmbeddings } from "../schema";

export type GetInboxForEmbeddingParams = {
  inboxId: string;
};

export async function getInboxForEmbedding(
  db: Database,
  params: GetInboxForEmbeddingParams,
) {
  return db
    .select({
      id: inbox.id,
      displayName: inbox.displayName,
      website: inbox.website,
      description: inbox.description,
    })
    .from(inbox)
    .where(eq(inbox.id, params.inboxId))
    .limit(1);
}

export type CreateInboxEmbeddingParams = {
  inboxId: string;
  teamId: string;
  embedding: number[];
  sourceText: string;
  model: string;
};

export async function createInboxEmbedding(
  db: Database,
  params: CreateInboxEmbeddingParams,
) {
  return db.insert(inboxEmbeddings).values(params).returning({
    id: inboxEmbeddings.id,
    inboxId: inboxEmbeddings.inboxId,
  });
}

export type CheckInboxEmbeddingExistsParams = {
  inboxId: string;
};

export async function checkInboxEmbeddingExists(
  db: Database,
  params: CheckInboxEmbeddingExistsParams,
) {
  const result = await db
    .select({ id: inboxEmbeddings.id })
    .from(inboxEmbeddings)
    .where(eq(inboxEmbeddings.inboxId, params.inboxId))
    .limit(1);

  return result.length > 0;
}

export type CreateInboxEmbeddingsParams = {
  items: Array<{
    inboxId: string;
    teamId: string;
    embedding: number[];
    sourceText: string;
    model: string;
  }>;
};

export async function createInboxEmbeddings(
  db: Database,
  params: CreateInboxEmbeddingsParams,
) {
  if (params.items.length === 0) return [];

  return db.insert(inboxEmbeddings).values(params.items).returning({
    id: inboxEmbeddings.id,
    inboxId: inboxEmbeddings.inboxId,
  });
}

export type GetInboxItemsForEmbeddingParams = {
  inboxIds: string[];
};

export async function getInboxItemsForEmbedding(
  db: Database,
  params: GetInboxItemsForEmbeddingParams,
) {
  if (params.inboxIds.length === 0) return [];

  return db
    .select({
      id: inbox.id,
      displayName: inbox.displayName,
      website: inbox.website,
      description: inbox.description,
    })
    .from(inbox)
    .where(inArray(inbox.id, params.inboxIds));
}

export type DeleteInboxEmbeddingParams = {
  inboxId: string;
  teamId: string;
};

export async function deleteInboxEmbedding(
  db: Database,
  params: DeleteInboxEmbeddingParams,
) {
  const [result] = await db
    .delete(inboxEmbeddings)
    .where(
      and(
        eq(inboxEmbeddings.inboxId, params.inboxId),
        eq(inboxEmbeddings.teamId, params.teamId),
      ),
    )
    .returning({
      id: inboxEmbeddings.id,
      inboxId: inboxEmbeddings.inboxId,
    });

  return result;
}
