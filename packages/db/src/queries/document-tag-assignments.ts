import type { Database } from "@db/client";
import { documentTagAssignments } from "@db/schema";
import { and, eq } from "drizzle-orm";

export type CreateDocumentTagAssignmentParams = {
  documentId: string;
  tagId: string;
  teamId: string;
};

export const createDocumentTagAssignment = async (
  db: Database,
  params: CreateDocumentTagAssignmentParams,
) => {
  const [result] = await db
    .insert(documentTagAssignments)
    .values({
      documentId: params.documentId,
      tagId: params.tagId,
      teamId: params.teamId,
    })
    .returning();

  return result;
};

export type DeleteDocumentTagAssignmentParams = {
  documentId: string;
  tagId: string;
  teamId: string;
};

export const deleteDocumentTagAssignment = async (
  db: Database,
  params: DeleteDocumentTagAssignmentParams,
) => {
  const [result] = await db
    .delete(documentTagAssignments)
    .where(
      and(
        eq(documentTagAssignments.documentId, params.documentId),
        eq(documentTagAssignments.tagId, params.tagId),
        eq(documentTagAssignments.teamId, params.teamId),
      ),
    )
    .returning();

  return result;
};

export type UpsertDocumentTagAssignmentParams = {
  documentId: string;
  tagId: string;
  teamId: string;
};

export const upsertDocumentTagAssignments = async (
  db: Database,
  params: UpsertDocumentTagAssignmentParams[],
) => {
  if (params.length === 0) {
    return [];
  }

  return db
    .insert(documentTagAssignments)
    .values(params)
    .onConflictDoNothing({
      target: [documentTagAssignments.documentId, documentTagAssignments.tagId],
    })
    .returning();
};
