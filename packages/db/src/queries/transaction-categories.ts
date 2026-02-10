import { and, asc, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import type { Database } from "../client";
import { transactionCategories } from "../schema";
import { generateCategoryEmbedding } from "../utils/embeddings";
import { createActivity } from "./activities";

export type GetCategoriesParams = {
  teamId: string;
  limit?: number;
};

export type GetCategoryByIdParams = {
  id: string;
  teamId: string;
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
      taxReportingCode: transactionCategories.taxReportingCode,
      excluded: transactionCategories.excluded,
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
      desc(transactionCategories.system),
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
      taxReportingCode: transactionCategories.taxReportingCode,
      excluded: transactionCategories.excluded,
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

export const getCategoryById = async (
  db: Database,
  params: GetCategoryByIdParams,
) => {
  const { id, teamId } = params;

  const [result] = await db
    .select({
      id: transactionCategories.id,
      name: transactionCategories.name,
      color: transactionCategories.color,
      slug: transactionCategories.slug,
      description: transactionCategories.description,
      system: transactionCategories.system,
      taxRate: transactionCategories.taxRate,
      taxType: transactionCategories.taxType,
      taxReportingCode: transactionCategories.taxReportingCode,
      excluded: transactionCategories.excluded,
      parentId: transactionCategories.parentId,
      createdAt: transactionCategories.createdAt,
    })
    .from(transactionCategories)
    .where(
      and(
        eq(transactionCategories.id, id),
        eq(transactionCategories.teamId, teamId),
      ),
    )
    .limit(1);

  if (!result) {
    return result;
  }

  // Get children for this category
  const children = await db
    .select({
      id: transactionCategories.id,
      name: transactionCategories.name,
      color: transactionCategories.color,
      slug: transactionCategories.slug,
      description: transactionCategories.description,
      system: transactionCategories.system,
      taxRate: transactionCategories.taxRate,
      taxType: transactionCategories.taxType,
      taxReportingCode: transactionCategories.taxReportingCode,
      excluded: transactionCategories.excluded,
      parentId: transactionCategories.parentId,
    })
    .from(transactionCategories)
    .where(
      and(
        eq(transactionCategories.parentId, id),
        eq(transactionCategories.teamId, teamId),
      ),
    )
    .orderBy(asc(transactionCategories.name));

  return {
    ...result,
    children,
  };
};

export type CreateTransactionCategoryParams = {
  teamId: string;
  userId?: string;
  name: string;
  color?: string | null;
  description?: string | null;
  taxRate?: number | null;
  taxType?: string | null;
  taxReportingCode?: string | null;
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
    taxReportingCode,
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
      taxReportingCode,
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
        taxReportingCode: result.taxReportingCode,
        parentId: result.parentId,
      },
    });

    // Generate embedding for the new category (async, don't block the response)
    generateCategoryEmbedding(db, {
      name: result.name,
      system: false, // User-created category
    }).catch((error) => {
      console.error(
        `Failed to generate embedding for category "${result.name}":`,
        error,
      );
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
  taxReportingCode?: string | null;
  parentId?: string | null;
};

export const updateTransactionCategory = async (
  db: Database,
  params: UpdateTransactionCategoryParams,
) => {
  const { id, teamId, ...updates } = params;

  // If parentId is being changed, check if the category has children
  if (updates.parentId !== undefined) {
    const childrenCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactionCategories)
      .where(
        and(
          eq(transactionCategories.parentId, id),
          eq(transactionCategories.teamId, teamId),
        ),
      );

    if (childrenCount[0]?.count && childrenCount[0].count > 0) {
      throw new Error("Cannot change parent of a category that has children");
    }
  }

  // If name is being updated, get the current category first
  let oldName: string | undefined;
  if (updates.name) {
    const [currentCategory] = await db
      .select({ name: transactionCategories.name })
      .from(transactionCategories)
      .where(
        and(
          eq(transactionCategories.id, id),
          eq(transactionCategories.teamId, teamId),
        ),
      )
      .limit(1);

    oldName = currentCategory?.name;
  }

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

  // If the name was updated, regenerate the embedding
  if (result && updates.name && oldName && updates.name !== oldName) {
    generateCategoryEmbedding(db, {
      name: updates.name,
      system: result.system || false,
    }).catch((error) => {
      console.error(
        `Failed to update embedding for category "${updates.name}":`,
        error,
      );
    });
  }

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
