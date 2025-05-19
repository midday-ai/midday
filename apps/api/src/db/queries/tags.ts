import type { Database } from "@api/db";
import { tags } from "@api/db/schema";
import { and, eq } from "drizzle-orm";

type CreateTagParams = {
  teamId: string;
  name: string;
};

export const createTag = async (db: Database, params: CreateTagParams) => {
  const { teamId, name } = params;

  const [result] = await db
    .insert(tags)
    .values({
      teamId,
      name,
    })
    .returning({
      id: tags.id,
      name: tags.name,
    });

  if (!result) {
    throw new Error("Failed to create tag");
  }

  return result;
};

type UpdateTagParams = {
  id: string;
  name: string;
};

export const updateTag = async (db: Database, params: UpdateTagParams) => {
  const { id, name } = params;

  const [result] = await db
    .update(tags)
    .set({ name })
    .where(eq(tags.id, id))
    .returning({
      id: tags.id,
      name: tags.name,
    });

  if (!result) {
    throw new Error("Tag not found");
  }

  return result;
};

export const deleteTag = async (db: Database, id: string) => {
  await db.delete(tags).where(eq(tags.id, id)).returning();
};

export type GetTagsParams = {
  teamId: string;
};

export const getTags = async (db: Database, params: GetTagsParams) => {
  const { teamId } = params;

  const results = await db
    .select({
      id: tags.id,
      name: tags.name,
      teamId: tags.teamId,
      createdAt: tags.createdAt,
    })
    .from(tags)
    .where(eq(tags.teamId, teamId))
    .orderBy(tags.name);

  return results;
};

export const getTaById = async (db: Database, id: string) => {
  const [result] = await db
    .select({
      id: tags.id,
      name: tags.name,
      teamId: tags.teamId,
      createdAt: tags.createdAt,
    })
    .from(tags)
    .where(eq(tags.id, id));

  return result;
};
