import type { Database } from "@api/db";
import { documentTagAssignments } from "@api/db/schema";
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
      ),
    )
    .returning();

  return result;
};
