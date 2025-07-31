import type { Database } from "@db/client";
import {
  documentTagAssignments,
  documents,
  transactionAttachments,
} from "@db/schema";
import { buildSearchQuery } from "@midday/db/utils/search-query";
import { and, desc, eq, gte, inArray, like, lte, not, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm/sql/sql";

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
          documentTag: {
            columns: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  });
}

export type GetDocumentsParams = {
  teamId: string;
  pageSize?: number;
  cursor?: string | null;
  language?: string | null;
  q?: string | null;
  tags?: string[] | null;
  start?: string | null;
  end?: string | null;
};

export async function getDocuments(db: Database, params: GetDocumentsParams) {
  const { teamId, pageSize = 20, cursor, tags, q, start, end } = params;

  // Convert cursor to offset
  const offset = cursor ? Number.parseInt(cursor, 10) : 0;

  // Base conditions for the WHERE clause
  const whereConditions: SQL[] = [
    eq(documents.teamId, teamId),
    not(like(documents.name, "%.folderPlaceholder")),
  ];

  // Add date range conditions if provided
  if (start && end) {
    whereConditions.push(gte(documents.date, start));
    whereConditions.push(lte(documents.date, end));
  }

  // Add text search condition if query is provided
  if (q) {
    // Using the ftsEnglish field for text search with websearch format
    const searchQuery = buildSearchQuery(q);

    whereConditions.push(
      sql`${documents.ftsEnglish} @@ to_tsquery('english', ${searchQuery})`,
    );
  }

  // For tag filtering, we need a specific approach
  if (tags && tags.length > 0) {
    // Get document IDs that match the tag filter
    const docIdsWithTags = await db
      .select({ documentId: documentTagAssignments.documentId })
      .from(documentTagAssignments)
      .where(
        and(
          eq(documentTagAssignments.teamId, teamId),
          inArray(documentTagAssignments.tagId, tags),
        ),
      );

    // Extract the document IDs
    const documentIds = docIdsWithTags.map((row) => row.documentId);

    // If no documents match the tags, return empty result early
    if (documentIds.length === 0) {
      return {
        meta: {
          cursor: undefined,
          hasPreviousPage: offset > 0,
          hasNextPage: false,
        },
        data: [],
      };
    }

    // Add the document ID filter
    whereConditions.push(inArray(documents.id, documentIds));
  }

  // Execute the query
  const data = await db.query.documents.findMany({
    where: and(...whereConditions),
    columns: {
      id: true,
      name: true,
      title: true,
      summary: true,
      date: true,
      metadata: true,
      pathTokens: true,
      processingStatus: true,
    },
    with: {
      documentTagAssignments: {
        with: {
          documentTag: true,
        },
      },
    },
    limit: pageSize,
    offset,
    orderBy: desc(documents.createdAt),
  });

  // Generate next cursor (offset)
  const nextCursor =
    data.length === pageSize ? (offset + pageSize).toString() : undefined;

  return {
    meta: {
      cursor: nextCursor,
      hasPreviousPage: offset > 0,
      hasNextPage: data.length === pageSize,
    },
    data,
  };
}

export type GetRelatedDocumentsParams = {
  id: string;
  pageSize: number;
  teamId: string;
};

export type GetRelatedDocumentsResponse = {
  id: string;
  name: string;
  metadata: Record<string, unknown>;
  path_tokens: string[];
  tag: string;
  title: string;
  summary: string;
  title_similarity: number;
};

export async function getRelatedDocuments(
  db: Database,
  params: GetRelatedDocumentsParams,
) {
  const { id, pageSize, teamId } = params;

  const result: GetRelatedDocumentsResponse[] = await db.executeOnReplica(
    sql`SELECT * FROM match_similar_documents_by_title(${id}, ${teamId}, ${0.3}, ${pageSize})`,
  );

  return result.map((result) => ({
    id: result.id,
    name: result.name,
    metadata: result.metadata,
    pathTokens: result.path_tokens,
    tag: result.tag,
    title: result.title,
    summary: result.summary,
  }));
}

export type DeleteDocumentParams = {
  id: string;
  teamId: string;
};

export async function deleteDocument(
  db: Database,
  params: DeleteDocumentParams,
) {
  // First get the document to retrieve its path_tokens
  const [result] = await db
    .delete(documents)
    .where(
      and(eq(documents.id, params.id), eq(documents.teamId, params.teamId)),
    )
    .returning({
      id: documents.id,
      pathTokens: documents.pathTokens,
    });

  if (!result) {
    return null;
  }

  // Delete all transaction attachments that have the same path
  // Convert the array to PostgreSQL array literal format
  const pathArray = `{${result.pathTokens?.map((token) => `"${token}"`).join(",")}}`;

  await db
    .delete(transactionAttachments)
    .where(
      and(
        eq(transactionAttachments.teamId, params.teamId),
        sql`${transactionAttachments.path} @> ${pathArray}::text[] AND ${transactionAttachments.path} <@ ${pathArray}::text[]`,
      ),
    );

  return result;
}

export type UpdateDocumentsParams = {
  ids: string[];
  teamId: string;
  processingStatus: "pending" | "processing" | "completed" | "failed";
};

export async function updateDocuments(
  db: Database,
  params: UpdateDocumentsParams,
) {
  const { ids, teamId, processingStatus } = params;

  if (!ids) {
    return [];
  }

  return db
    .update(documents)
    .set({ processingStatus })
    .where(and(eq(documents.teamId, teamId), inArray(documents.name, ids)))
    .returning();
}

export type UpdateDocumentByPathParams = {
  pathTokens: string[];
  teamId: string;
  title?: string;
  summary?: string;
  content?: string;
  body?: string;
  tag?: string;
  date?: string;
  language?: string;
  processingStatus?: "pending" | "processing" | "completed" | "failed";
  metadata?: Record<string, unknown>;
};

export async function updateDocumentByPath(
  db: Database,
  params: UpdateDocumentByPathParams,
) {
  const {
    pathTokens,
    teamId,
    title,
    summary,
    content,
    body,
    tag,
    date,
    language,
    processingStatus,
    metadata,
  } = params;

  if (!pathTokens || pathTokens.length === 0) {
    return null;
  }

  return db
    .update(documents)
    .set({
      title,
      summary,
      content,
      body,
      tag,
      date,
      language,
      processingStatus,
      metadata,
    })
    .where(
      and(eq(documents.teamId, teamId), eq(documents.pathTokens, pathTokens)),
    )
    .returning();
}

export type UpdateDocumentByFileNameParams = {
  fileName: string;
  teamId: string;
  title?: string;
  summary?: string;
  content?: string;
  body?: string;
  tag?: string;
  date?: string;
  language?: string;
  processingStatus?: "pending" | "processing" | "completed" | "failed";
  metadata?: Record<string, unknown>;
};

export async function updateDocumentByFileName(
  db: Database,
  params: UpdateDocumentByFileNameParams,
) {
  const {
    fileName,
    teamId,
    title,
    summary,
    content,
    body,
    tag,
    date,
    language,
    processingStatus,
    metadata,
  } = params;

  const [result] = await db
    .update(documents)
    .set({
      title,
      summary,
      content,
      body,
      tag,
      date,
      language,
      processingStatus,
      metadata,
    })
    .where(and(eq(documents.teamId, teamId), eq(documents.name, fileName)))
    .returning({ id: documents.id });

  return result;
}

export type UpdateDocumentProcessingStatusParams = {
  id: string;
  processingStatus: "pending" | "processing" | "completed" | "failed";
};

export async function updateDocumentProcessingStatus(
  db: Database,
  params: UpdateDocumentProcessingStatusParams,
) {
  const { id, processingStatus } = params;

  return db
    .update(documents)
    .set({ processingStatus })
    .where(eq(documents.id, id))
    .returning({ id: documents.id });
}
