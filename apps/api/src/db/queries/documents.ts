import type { Database } from "@api/db";
import { documents } from "@api/db/schema";
import { and, eq } from "drizzle-orm";

export type GetDocumentQueryParams = {
  teamId: string;
  id?: string | null;
  filePath?: string | null;
};

export async function getDocumentById(
  db: Database,
  params: GetDocumentQueryParams,
) {
  const conditions = [eq(documents.teamId, params.teamId)];

  if (params.id) {
    conditions.push(eq(documents.id, params.id));
  }

  if (params.filePath) {
    conditions.push(eq(documents.name, params.filePath));
  }

  return db.query.documents.findFirst({
    where: and(...conditions),
    with: {
      documentTagAssignments: {
        with: {
          documentTag: true,
        },
      },
    },
  });
}
