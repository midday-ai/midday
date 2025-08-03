import type { Database } from "@db/client";
import { documentTagEmbeddings } from "@db/schema";
import { inArray, sql } from "drizzle-orm";

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

export type GetDocumentTagEmbeddingsParams = {
  slugs: string[];
};

export async function getDocumentTagEmbeddings(
  db: Database,
  params: GetDocumentTagEmbeddingsParams,
) {
  if (params.slugs.length === 0) {
    return [];
  }

  return db.query.documentTagEmbeddings.findMany({
    where: inArray(documentTagEmbeddings.slug, params.slugs),
    columns: {
      slug: true,
      name: true,
    },
  });
}

export type UpsertDocumentTagEmbeddingParams = {
  slug: string;
  name: string;
  embedding: string;
};

export async function upsertDocumentTagEmbeddings(
  db: Database,
  params: UpsertDocumentTagEmbeddingParams[],
) {
  if (params.length === 0) {
    return [];
  }

  const values = params.map((param) => ({
    slug: param.slug,
    name: param.name,
    embedding: JSON.parse(param.embedding),
  }));

  return db
    .insert(documentTagEmbeddings)
    .values(values)
    .onConflictDoUpdate({
      target: documentTagEmbeddings.slug,
      set: {
        name: sql`excluded.name`,
        embedding: sql`excluded.embedding`,
      },
    })
    .returning({
      slug: documentTagEmbeddings.slug,
      name: documentTagEmbeddings.name,
    });
}
