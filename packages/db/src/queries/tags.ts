import type { Database } from "@db/client";
import { tags } from "@db/schema";
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
  teamId: string;
};

export const updateTag = async (db: Database, params: UpdateTagParams) => {
  const { id, name, teamId } = params;

  const [result] = await db
    .update(tags)
    .set({ name })
    .where(and(eq(tags.id, id), eq(tags.teamId, teamId)))
    .returning({
      id: tags.id,
      name: tags.name,
    });

  if (!result) {
    throw new Error("Tag not found");
  }

  return result;
};

type DeleteTagParams = {
  id: string;
  teamId: string;
};

export const deleteTag = async (db: Database, params: DeleteTagParams) => {
  const { id, teamId } = params;

  const [result] = await db
    .delete(tags)
    .where(and(eq(tags.id, id), eq(tags.teamId, teamId)))
    .returning({
      id: tags.id,
      name: tags.name,
    });

  return result;
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

type GetTagByIdParams = {
  id: string;
  teamId: string;
};

export const getTagById = async (db: Database, params: GetTagByIdParams) => {
  const { id, teamId } = params;

  const [result] = await db
    .select({
      id: tags.id,
      name: tags.name,
      teamId: tags.teamId,
      createdAt: tags.createdAt,
    })
    .from(tags)
    .where(and(eq(tags.id, id), eq(tags.teamId, teamId)));

  return result;
};
