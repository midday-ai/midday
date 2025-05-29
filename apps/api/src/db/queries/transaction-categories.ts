import type { Database } from "@api/db";
import { transactionCategories } from "@api/db/schema";
import { and, asc, desc, eq, sql } from "drizzle-orm";

export type GetCategoriesParams = {
  teamId: string;
  limit?: number;
};

export const getCategories = async (
  db: Database,
  params: GetCategoriesParams,
) => {
  const { teamId, limit = 1000 } = params;

  return db
    .select({
      id: transactionCategories.id,
      name: transactionCategories.name,
      color: transactionCategories.color,
      slug: transactionCategories.slug,
      description: transactionCategories.description,
      system: transactionCategories.system,
      vat: transactionCategories.vat,
    })
    .from(transactionCategories)
    .where(eq(transactionCategories.teamId, teamId))
    .orderBy(
      desc(transactionCategories.createdAt),
      asc(transactionCategories.name),
    )
    .limit(limit);
};

export type CreateTransactionCategoryParams = {
  teamId: string;
  name: string;
  color?: string | null;
  description?: string | null;
  vat?: number | null;
};

export const createTransactionCategory = async (
  db: Database,
  params: CreateTransactionCategoryParams,
) => {
  const { teamId, name, color, description, vat } = params;

  const [result] = await db
    .insert(transactionCategories)
    .values({
      teamId,
      name,
      color,
      description,
      vat,
    })
    .returning();

  return result;
};

export type CreateTransactionCategoriesParams = {
  teamId: string;
  categories: {
    name: string;
    color?: string | null;
    description?: string | null;
    vat?: number | null;
  }[];
};

export const createTransactionCategories = async (
  db: Database,
  params: CreateTransactionCategoriesParams,
) => {
  const { teamId, categories } = params;

  if (categories.length === 0) {
    return [];
  }

  return db
    .insert(transactionCategories)
    .values(
      categories.map((category) => ({
        ...category,
        teamId,
      })),
    )
    .returning();
};

export type UpdateTransactionCategoryParams = {
  id: string;
  teamId: string;
  name?: string;
  color?: string | null;
  description?: string | null;
  vat?: number | null;
};

export const updateTransactionCategory = async (
  db: Database,
  params: UpdateTransactionCategoryParams,
) => {
  const { id, teamId, ...updates } = params;

  const [result] = await db
    .update(transactionCategories)
    .set(updates)
    .where(
      and(
        eq(transactionCategories.id, id),
        eq(transactionCategories.teamId, teamId),
      ),
    )
    .returning();

  return result;
};

export type DeleteTransactionCategoryParams = {
  id: string;
  teamId: string;
};

export const deleteTransactionCategory = async (
  db: Database,
  params: DeleteTransactionCategoryParams,
) => {
  const [result] = await db
    .delete(transactionCategories)
    .where(
      and(
        eq(transactionCategories.id, params.id),
        eq(transactionCategories.teamId, params.teamId),
        eq(transactionCategories.system, false),
      ),
    )
    .returning();

  return result;
};
