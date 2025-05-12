import type { Database } from "@api/db";
import { documentTags } from "@api/db/schema";
import { eq } from "drizzle-orm";

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
};

export const deleteDocumentTag = async (db: Database, id: string) => {
  const [result] = await db
    .delete(documentTags)
    .where(eq(documentTags.id, id))
    .returning({
      id: documentTags.id,
    });

  return result;
};
