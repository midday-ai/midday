import type { Database } from "@db/client";
import { inbox, inboxEmbeddings } from "@db/schema";
import { and, eq } from "drizzle-orm";

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
