import type { Database } from "@api/db";
import { documentTagEmbeddings } from "@api/db/schema";

type CreateDocumentTagEmbeddingParams = {
  slug: string;
  name: string;
  embedding: string;
};

export async function createDocumentTagEmbedding(
  db: Database,
  params: CreateDocumentTagEmbeddingParams,
) {
  return db.insert(documentTagEmbeddings).values({
    slug: params.slug,
    name: params.name,
    embedding: JSON.parse(params.embedding),
  });
}
