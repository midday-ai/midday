import type { Database } from "@db/client";
import { documentTags } from "@db/schema";
import { and, eq } from "drizzle-orm";

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
