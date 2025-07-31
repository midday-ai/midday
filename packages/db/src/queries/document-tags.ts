import type { Database } from "@db/client";
import { documentTags } from "@db/schema";
import { and, eq, sql } from "drizzle-orm";

export const getDocumentTags = async (db: Database, teamId: string) => {
  return db.query.documentTags.findMany({
    where: eq(documentTags.teamId, teamId),
    columns: {
      id: true,
      name: true,
    },
    orderBy: (documentTags, { desc }) => [desc(documentTags.createdAt)],
  });
};

export type CreateDocumentTagParams = {
  name: string;
  teamId: string;
  slug: string;
};

export const createDocumentTag = async (
  db: Database,
  params: CreateDocumentTagParams,
) => {
  const [result] = await db
    .insert(documentTags)
    .values({
      name: params.name,
      slug: params.slug,
      teamId: params.teamId,
    })
    .returning({
      id: documentTags.id,
      name: documentTags.name,
      slug: documentTags.slug,
    });

  return result;
};

export type DeleteDocumentTagParams = {
  id: string;
  teamId: string;
};

export const deleteDocumentTag = async (
  db: Database,
  params: DeleteDocumentTagParams,
) => {
  const { id, teamId } = params;

  const [result] = await db
    .delete(documentTags)
    .where(and(eq(documentTags.id, id), eq(documentTags.teamId, teamId)))
    .returning({
      id: documentTags.id,
    });

  return result;
};

export type UpsertDocumentTagParams = {
  name: string;
  slug: string;
  teamId: string;
};

export const upsertDocumentTags = async (
  db: Database,
  params: UpsertDocumentTagParams[],
) => {
  if (params.length === 0) {
    return [];
  }

  return db
    .insert(documentTags)
    .values(params)
    .onConflictDoUpdate({
      target: [documentTags.slug, documentTags.teamId],
      set: {
        name: sql`excluded.name`,
      },
    })
    .returning({
      id: documentTags.id,
      slug: documentTags.slug,
    });
};
