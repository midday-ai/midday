import type { Database } from "@db/client";
import { collectionCases, collectionNotes, users } from "@db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm/sql/sql";

// ============================================================================
// Collection Notes Queries
// ============================================================================

type GetCollectionNotesParams = {
  caseId: string;
  teamId: string;
  cursor?: string | null;
  pageSize?: number;
};

export const getCollectionNotes = async (
  db: Database,
  params: GetCollectionNotesParams,
) => {
  const { caseId, teamId, cursor, pageSize = 50 } = params;

  const whereConditions: SQL[] = [
    eq(collectionNotes.caseId, caseId),
    // Verify case belongs to the caller's team
    eq(collectionCases.teamId, teamId),
  ];

  if (cursor) {
    whereConditions.push(sql`${collectionNotes.createdAt} < ${cursor}`);
  }

  const data = await db
    .select({
      id: collectionNotes.id,
      caseId: collectionNotes.caseId,
      contactName: collectionNotes.contactName,
      contactMethod: collectionNotes.contactMethod,
      followUpDate: collectionNotes.followUpDate,
      summary: collectionNotes.summary,
      createdAt: collectionNotes.createdAt,
      // Author info
      authorId: users.id,
      authorName: users.fullName,
      authorAvatar: users.avatarUrl,
    })
    .from(collectionNotes)
    .innerJoin(collectionCases, eq(collectionCases.id, collectionNotes.caseId))
    .leftJoin(users, eq(users.id, collectionNotes.authorId))
    .where(and(...whereConditions))
    .orderBy(desc(collectionNotes.createdAt))
    .limit(pageSize + 1);

  const hasMore = data.length > pageSize;
  const notes = hasMore ? data.slice(0, pageSize) : data;
  const nextCursor = hasMore ? notes[notes.length - 1]?.createdAt : null;

  return {
    data: notes,
    meta: {
      cursor: nextCursor,
      hasMore,
    },
  };
};

// ============================================================================
// Collection Notes Mutations
// ============================================================================

type CreateCollectionNoteParams = {
  caseId: string;
  teamId?: string;
  authorId: string | null;
  contactName?: string;
  contactMethod?: string;
  followUpDate?: string;
  summary: string;
};

export const createCollectionNote = async (
  db: Database,
  params: CreateCollectionNoteParams,
) => {
  const [note] = await db
    .insert(collectionNotes)
    .values({
      caseId: params.caseId,
      authorId: params.authorId,
      contactName: params.contactName,
      contactMethod: params.contactMethod as (typeof collectionNotes.contactMethod.enumValues)[number] | undefined,
      followUpDate: params.followUpDate,
      summary: params.summary,
    })
    .returning();

  // If follow-up date provided, update the parent case's nextFollowUp
  if (params.followUpDate) {
    const whereConditions = [eq(collectionCases.id, params.caseId)];
    // Add team check if teamId is provided (not available in system contexts)
    if (params.teamId) {
      whereConditions.push(eq(collectionCases.teamId, params.teamId));
    }

    await db
      .update(collectionCases)
      .set({
        nextFollowUp: params.followUpDate,
        updatedAt: new Date().toISOString(),
      })
      .where(and(...whereConditions));
  }

  return note;
};
