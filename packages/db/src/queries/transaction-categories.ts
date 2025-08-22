import type { Database } from "@db/client";
import { transactionCategories } from "@db/schema";
import { and, asc, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { createActivity } from "./activities";

export type GetCategoriesParams = {
  teamId: string;
  limit?: number;
};

export const getCategories = async (
  db: Database,
  params: GetCategoriesParams,
) => {
  const { teamId, limit = 1000 } = params;

  // First get all parent categories (categories with no parentId)
  const parentCategories = await db
    .select({
      id: transactionCategories.id,
      name: transactionCategories.name,
      color: transactionCategories.color,
      slug: transactionCategories.slug,
      description: transactionCategories.description,
      system: transactionCategories.system,
      taxRate: transactionCategories.taxRate,
      taxType: transactionCategories.taxType,
      parentId: transactionCategories.parentId,
    })
    .from(transactionCategories)
    .where(
      and(
        eq(transactionCategories.teamId, teamId),
        isNull(transactionCategories.parentId),
      ),
    )
    .orderBy(
      desc(transactionCategories.createdAt),
      asc(transactionCategories.name),
    )
    .limit(limit);

  // Then get all child categories for these parents
  const childCategories = await db
    .select({
      id: transactionCategories.id,
      name: transactionCategories.name,
      color: transactionCategories.color,
      slug: transactionCategories.slug,
      description: transactionCategories.description,
      system: transactionCategories.system,
      taxRate: transactionCategories.taxRate,
      taxType: transactionCategories.taxType,
      parentId: transactionCategories.parentId,
    })
    .from(transactionCategories)
    .where(
      and(
        eq(transactionCategories.teamId, teamId),
        isNotNull(transactionCategories.parentId),
      ),
    )
    .orderBy(asc(transactionCategories.name));

  // Group children by parentId for efficient lookup
  const childrenByParentId = new Map<string, typeof childCategories>();
  for (const child of childCategories) {
    if (child.parentId) {
      if (!childrenByParentId.has(child.parentId)) {
        childrenByParentId.set(child.parentId, []);
      }
      childrenByParentId.get(child.parentId)!.push(child);
    }
  }

  // Attach children to their parents
  return parentCategories.map((parent) => ({
    ...parent,
    children: childrenByParentId.get(parent.id) || [],
  }));
};

export type CreateTransactionCategoryParams = {
  teamId: string;
  userId?: string;
  name: string;
  color?: string | null;
  description?: string | null;
  taxRate?: number | null;
  taxType?: string | null;
  parentId?: string | null;
};

export const createTransactionCategory = async (
  db: Database,
  params: CreateTransactionCategoryParams,
) => {
  const {
    teamId,
    userId,
    name,
    color,
    description,
    taxRate,
    taxType,
    parentId,
  } = params;

  const [result] = await db
    .insert(transactionCategories)
    .values({
      teamId,
      name,
      color,
      description,
      taxRate,
      taxType,
      parentId,
    })
    .returning();

  // Create activity for transaction category creation
  if (result) {
    createActivity(db, {
      teamId,
      userId,
      type: "transaction_category_created",
      source: "user",
      priority: 7,
      metadata: {
        categoryId: result.id,
        categoryName: result.name,
        categoryColor: result.color,
        categoryDescription: result.description,
        taxRate: result.taxRate,
        taxType: result.taxType,
        parentId: result.parentId,
      },
    });
  }

  return result;
};

export type CreateTransactionCategoriesParams = {
  teamId: string;
  userId?: string;
  categories: {
    name: string;
    color?: string | null;
    description?: string | null;
    taxRate?: number | null;
    taxType?: string | null;
    parentId?: string | null;
  }[];
};

export const createTransactionCategories = async (
  db: Database,
  params: CreateTransactionCategoriesParams,
) => {
  const { teamId, userId, categories } = params;

  if (categories.length === 0) {
    return [];
  }

  const result = await db
    .insert(transactionCategories)
    .values(
      categories.map((category) => ({
        ...category,
        teamId,
      })),
    )
    .returning();

  // Create activity for each category created
  for (const category of result) {
    createActivity(db, {
      teamId,
      userId,
      type: "transaction_category_created",
      source: "user",
      priority: 7,
      metadata: {
        categoryId: category.id,
        categoryName: category.name,
        categoryColor: category.color,
        categoryDescription: category.description,
        taxRate: category.taxRate,
        taxType: category.taxType,
        parentId: category.parentId,
      },
    });
  }

  return result;
};

export type UpdateTransactionCategoryParams = {
  id: string;
  teamId: string;
  name?: string;
  color?: string | null;
  description?: string | null;
  taxRate?: number | null;
  taxType?: string | null;
  parentId?: string | null;
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
