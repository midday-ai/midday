import type { LineItem } from "@midday/invoice/types";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import type { Database } from "../client";
import { invoiceProducts } from "../schema";

export type InvoiceProduct = {
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

export type CreateInvoiceProductParams = {
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

export type UpdateInvoiceProductParams = {
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

export type SearchInvoiceProductsParams = {
  teamId: string;
  query: string;
  limit?: number;
};

export async function createInvoiceProduct(
  db: Database,
  params: CreateInvoiceProductParams,
): Promise<InvoiceProduct> {
  const [result] = await db
    .insert(invoiceProducts)
    .values({
      ...params,
      lastUsedAt: new Date().toISOString(),
    })
    .returning();

  if (!result) {
    throw new Error("Failed to create invoice product");
  }

  return result;
}

export type UpsertInvoiceProductParams = {
  teamId: string;
  createdBy: string;
  name: string;
  description?: string | null;
  price?: number | null;
  currency?: string | null;
  unit?: string | null;
  taxRate?: number | null;
};

export async function upsertInvoiceProduct(
  db: Database,
  params: UpsertInvoiceProductParams,
): Promise<InvoiceProduct> {
  const now = new Date().toISOString();

  const [result] = await db
    .insert(invoiceProducts)
    .values({
      ...params,
      usageCount: 1,
      lastUsedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        invoiceProducts.teamId,
        invoiceProducts.name,
        invoiceProducts.currency,
        invoiceProducts.price,
      ],
      set: {
        // Update product details with latest information (only if provided)
        ...(params.description !== undefined && {
          description: params.description,
        }),
        ...(params.unit !== undefined && { unit: params.unit }),
        ...(params.taxRate !== undefined && { taxRate: params.taxRate }),
        usageCount: sql`${invoiceProducts.usageCount} + 1`,
        lastUsedAt: now,
        updatedAt: now,
        // Keep original createdBy, don't overwrite
      },
    })
    .returning();

  if (!result) {
    throw new Error("Failed to upsert invoice product");
  }

  return result;
}

export async function updateInvoiceProduct(
  db: Database,
  params: UpdateInvoiceProductParams,
): Promise<InvoiceProduct | null> {
  const { id, teamId, ...updateData } = params;

  const [result] = await db
    .update(invoiceProducts)
    .set({
      ...updateData,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(invoiceProducts.id, id), eq(invoiceProducts.teamId, teamId)))
    .returning();

  return result || null;
}

export async function getInvoiceProductById(
  db: Database,
  id: string,
  teamId: string,
): Promise<InvoiceProduct | null> {
  const [result] = await db
    .select()
    .from(invoiceProducts)
    .where(and(eq(invoiceProducts.id, id), eq(invoiceProducts.teamId, teamId)))
    .limit(1);

  return result || null;
}

export async function searchInvoiceProducts(
  db: Database,
  params: SearchInvoiceProductsParams,
): Promise<InvoiceProduct[]> {
  const { teamId, query, limit = 10 } = params;

  return await db
    .select()
    .from(invoiceProducts)
    .where(
      and(
        eq(invoiceProducts.teamId, teamId),
        eq(invoiceProducts.isActive, true),
        or(
          // Full-text search for better matching
          sql`${invoiceProducts.fts} @@ plainto_tsquery('english', ${query})`,
          // Partial name match for shorter queries
          ilike(invoiceProducts.name, `%${query}%`),
        ),
      ),
    )
    .orderBy(
      // Order by relevance, then usage frequency, then recency
      desc(
        sql`ts_rank(${invoiceProducts.fts}, plainto_tsquery('english', ${query}))`,
      ),
      desc(invoiceProducts.usageCount),
      desc(invoiceProducts.lastUsedAt),
    )
    .limit(limit);
}

export async function incrementProductUsage(
  db: Database,
  id: string,
  teamId: string,
): Promise<void> {
  await db
    .update(invoiceProducts)
    .set({
      usageCount: sql`${invoiceProducts.usageCount} + 1`,
      lastUsedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(invoiceProducts.id, id), eq(invoiceProducts.teamId, teamId)));
}

export async function getPopularInvoiceProducts(
  db: Database,
  teamId: string,
  limit = 20,
): Promise<InvoiceProduct[]> {
  return await db
    .select()
    .from(invoiceProducts)
    .where(
      and(
        eq(invoiceProducts.teamId, teamId),
        eq(invoiceProducts.isActive, true),
      ),
    )
    .orderBy(desc(invoiceProducts.usageCount), desc(invoiceProducts.lastUsedAt))
    .limit(limit);
}

export async function getRecentInvoiceProducts(
  db: Database,
  teamId: string,
  limit = 10,
): Promise<InvoiceProduct[]> {
  return await db
    .select()
    .from(invoiceProducts)
    .where(
      and(
        eq(invoiceProducts.teamId, teamId),
        eq(invoiceProducts.isActive, true),
      ),
    )
    .orderBy(desc(invoiceProducts.lastUsedAt))
    .limit(limit);
}

export type GetInvoiceProductsParams = {
  sortBy?: "popular" | "recent";
  limit?: number;
  includeInactive?: boolean;
  currency?: string | null;
};

export async function getInvoiceProducts(
  db: Database,
  teamId: string,
  params: GetInvoiceProductsParams = {},
): Promise<InvoiceProduct[]> {
  const {
    sortBy = "popular",
    limit = 50,
    includeInactive = false,
    currency,
  } = params;

  const whereConditions = [eq(invoiceProducts.teamId, teamId)];

  // Only filter by isActive if includeInactive is false
  if (!includeInactive) {
    whereConditions.push(eq(invoiceProducts.isActive, true));
  }

  if (currency) {
    whereConditions.push(eq(invoiceProducts.currency, currency));
  }

  const query = db
    .select()
    .from(invoiceProducts)
    .where(and(...whereConditions));

  // Apply sorting based on sortBy parameter
  if (sortBy === "recent") {
    query.orderBy(desc(invoiceProducts.lastUsedAt));
  } else {
    // Default to popular (usage count first, then recency)
    query.orderBy(
      desc(invoiceProducts.usageCount),
      desc(invoiceProducts.lastUsedAt),
    );
  }

  return await query.limit(limit);
}

export async function deleteInvoiceProduct(
  db: Database,
  id: string,
  teamId: string,
): Promise<boolean> {
  const [result] = await db
    .delete(invoiceProducts)
    .where(and(eq(invoiceProducts.id, id), eq(invoiceProducts.teamId, teamId)))
    .returning({ id: invoiceProducts.id });

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
): Promise<{ product: InvoiceProduct | null; shouldClearProductId: boolean }> {
  // If name is empty, signal to clear productId (don't save anything)
  if (!lineItem.name || lineItem.name.trim().length === 0) {
    return { product: null, shouldClearProductId: true };
  }

  const trimmedName = lineItem.name.trim();

  try {
    // If line item has a productId, update the existing product
    if (lineItem.productId) {
      const existingProduct = await getInvoiceProductById(
        db,
        lineItem.productId,
        teamId,
      );

      if (existingProduct) {
        // Update the existing product with new values
        const updatedProduct = await updateInvoiceProduct(db, {
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
    const product = await upsertInvoiceProduct(db, {
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
