import type { Database } from "@db/client";
import { dealProducts } from "@db/schema";
import type { LineItem } from "@midday/deal/types";
import { and, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";

export type DealProduct = {
  id: string;
  createdAt: string;
  updatedAt: string | null;
  teamId: string;
  createdBy: string | null;
  name: string;
  description: string | null;
  price: number | null;
  currency: string | null;
  unit: string | null;
  taxRate: number | null;
  isActive: boolean;
  usageCount: number;
  lastUsedAt: string | null;
};

export type CreateDealProductParams = {
  teamId: string;
  createdBy: string;
  name: string;
  description?: string | null;
  price?: number | null;
  currency?: string | null;
  unit?: string | null;
  taxRate?: number | null;
  isActive?: boolean;
};

export type UpdateDealProductParams = {
  id: string;
  teamId: string;
  name?: string;
  description?: string | null;
  price?: number | null;
  currency?: string | null;
  unit?: string | null;
  taxRate?: number | null;
  isActive?: boolean;
  usageCount?: number;
  lastUsedAt?: string | null;
};

export type SearchDealProductsParams = {
  teamId: string;
  query: string;
  limit?: number;
};

export async function createDealProduct(
  db: Database,
  params: CreateDealProductParams,
): Promise<DealProduct> {
  const [result] = await db
    .insert(dealProducts)
    .values({
      ...params,
      lastUsedAt: new Date().toISOString(),
    })
    .returning();

  if (!result) {
    throw new Error("Failed to create deal product");
  }

  return result;
}

export type UpsertDealProductParams = {
  teamId: string;
  createdBy: string;
  name: string;
  description?: string | null;
  price?: number | null;
  currency?: string | null;
  unit?: string | null;
  taxRate?: number | null;
};

export async function upsertDealProduct(
  db: Database,
  params: UpsertDealProductParams,
): Promise<DealProduct> {
  const now = new Date().toISOString();

  const [result] = await db
    .insert(dealProducts)
    .values({
      ...params,
      usageCount: 1,
      lastUsedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        dealProducts.teamId,
        dealProducts.name,
        dealProducts.currency,
        dealProducts.price,
      ],
      set: {
        // Update product details with latest information (only if provided)
        ...(params.description !== undefined && {
          description: params.description,
        }),
        ...(params.unit !== undefined && { unit: params.unit }),
        ...(params.taxRate !== undefined && { taxRate: params.taxRate }),
        usageCount: sql`${dealProducts.usageCount} + 1`,
        lastUsedAt: now,
        updatedAt: now,
        // Keep original createdBy, don't overwrite
      },
    })
    .returning();

  if (!result) {
    throw new Error("Failed to upsert deal product");
  }

  return result;
}

export async function updateDealProduct(
  db: Database,
  params: UpdateDealProductParams,
): Promise<DealProduct | null> {
  const { id, teamId, ...updateData } = params;

  const [result] = await db
    .update(dealProducts)
    .set({
      ...updateData,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(dealProducts.id, id), eq(dealProducts.teamId, teamId)))
    .returning();

  return result || null;
}

export async function getDealProductById(
  db: Database,
  id: string,
  teamId: string,
): Promise<DealProduct | null> {
  const [result] = await db
    .select()
    .from(dealProducts)
    .where(and(eq(dealProducts.id, id), eq(dealProducts.teamId, teamId)))
    .limit(1);

  return result || null;
}

export async function searchDealProducts(
  db: Database,
  params: SearchDealProductsParams,
): Promise<DealProduct[]> {
  const { teamId, query, limit = 10 } = params;

  return await db
    .select()
    .from(dealProducts)
    .where(
      and(
        eq(dealProducts.teamId, teamId),
        eq(dealProducts.isActive, true),
        or(
          // Full-text search for better matching
          sql`${dealProducts.fts} @@ plainto_tsquery('english', ${query})`,
          // Partial name match for shorter queries
          ilike(dealProducts.name, `%${query}%`),
        ),
      ),
    )
    .orderBy(
      // Order by relevance, then usage frequency, then recency
      desc(
        sql`ts_rank(${dealProducts.fts}, plainto_tsquery('english', ${query}))`,
      ),
      desc(dealProducts.usageCount),
      desc(dealProducts.lastUsedAt),
    )
    .limit(limit);
}

export async function incrementProductUsage(
  db: Database,
  id: string,
  teamId: string,
): Promise<void> {
  await db
    .update(dealProducts)
    .set({
      usageCount: sql`${dealProducts.usageCount} + 1`,
      lastUsedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(dealProducts.id, id), eq(dealProducts.teamId, teamId)));
}

export async function getPopularDealProducts(
  db: Database,
  teamId: string,
  limit = 20,
): Promise<DealProduct[]> {
  return await db
    .select()
    .from(dealProducts)
    .where(
      and(
        eq(dealProducts.teamId, teamId),
        eq(dealProducts.isActive, true),
      ),
    )
    .orderBy(desc(dealProducts.usageCount), desc(dealProducts.lastUsedAt))
    .limit(limit);
}

export async function getRecentDealProducts(
  db: Database,
  teamId: string,
  limit = 10,
): Promise<DealProduct[]> {
  return await db
    .select()
    .from(dealProducts)
    .where(
      and(
        eq(dealProducts.teamId, teamId),
        eq(dealProducts.isActive, true),
      ),
    )
    .orderBy(desc(dealProducts.lastUsedAt))
    .limit(limit);
}

export type GetDealProductsParams = {
  sortBy?: "popular" | "recent";
  limit?: number;
  includeInactive?: boolean;
  currency?: string | null;
};

export async function getDealProducts(
  db: Database,
  teamId: string,
  params: GetDealProductsParams = {},
): Promise<DealProduct[]> {
  const {
    sortBy = "popular",
    limit = 50,
    includeInactive = false,
    currency,
  } = params;

  const whereConditions = [eq(dealProducts.teamId, teamId)];

  // Only filter by isActive if includeInactive is false
  if (!includeInactive) {
    whereConditions.push(eq(dealProducts.isActive, true));
  }

  if (currency) {
    whereConditions.push(eq(dealProducts.currency, currency));
  }

  const query = db
    .select()
    .from(dealProducts)
    .where(and(...whereConditions));

  // Apply sorting based on sortBy parameter
  if (sortBy === "recent") {
    query.orderBy(desc(dealProducts.lastUsedAt));
  } else {
    // Default to popular (usage count first, then recency)
    query.orderBy(
      desc(dealProducts.usageCount),
      desc(dealProducts.lastUsedAt),
    );
  }

  return await query.limit(limit);
}

export async function deleteDealProduct(
  db: Database,
  id: string,
  teamId: string,
): Promise<boolean> {
  const [result] = await db
    .delete(dealProducts)
    .where(and(eq(dealProducts.id, id), eq(dealProducts.teamId, teamId)))
    .returning({ id: dealProducts.id });

  return !!result;
}

/**
 * Save a line item as a product - creates new product or updates existing one
 * This is called when a line item is modified (on blur/change)
 */
export async function saveLineItemAsProduct(
  db: Database,
  teamId: string,
  userId: string,
  lineItem: LineItem,
  currency?: string,
): Promise<{ product: DealProduct | null; shouldClearProductId: boolean }> {
  // If name is empty, signal to clear productId (don't save anything)
  if (!lineItem.name || lineItem.name.trim().length === 0) {
    return { product: null, shouldClearProductId: true };
  }

  const trimmedName = lineItem.name.trim();

  try {
    // If line item has a productId, update the existing product
    if (lineItem.productId) {
      const existingProduct = await getDealProductById(
        db,
        lineItem.productId,
        teamId,
      );

      if (existingProduct) {
        // Update the existing product with new values
        const updatedProduct = await updateDealProduct(db, {
          id: lineItem.productId,
          teamId,
          name: trimmedName,
          price:
            lineItem.price !== undefined
              ? lineItem.price
              : existingProduct.price,
          currency: currency || existingProduct.currency,
          unit:
            lineItem.unit !== undefined ? lineItem.unit : existingProduct.unit,
          lastUsedAt: new Date().toISOString(),
        });

        return {
          product: updatedProduct,
          shouldClearProductId: false,
        };
      }
    }

    // No productId or product not found - create new product based on team + name + currency + price
    const product = await upsertDealProduct(db, {
      teamId,
      createdBy: userId,
      name: trimmedName,
      description: null,
      price: lineItem.price !== undefined ? lineItem.price : null,
      currency: currency || null,
      unit: lineItem.unit !== undefined ? lineItem.unit : null,
    });

    return { product, shouldClearProductId: false };
  } catch (error) {
    console.error(
      `Failed to save line item as product "${trimmedName}":`,
      error,
    );
    return {
      product: null,
      shouldClearProductId: false,
    };
  }
}
