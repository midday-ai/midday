import type { Database } from "@db/client";
import { documentTagEmbeddings } from "@db/schema";

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
