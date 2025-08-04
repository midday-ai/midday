import type { Database } from "@db/client";
import { transactions } from "@db/schema";
import { type SQL, and, eq, inArray, isNull, sql } from "drizzle-orm";

export type GetTransactionsForEnrichmentParams = {
  transactionIds: string[];
  teamId: string;
};

export type TransactionForEnrichment = {
  id: string;
  name: string;
  counterpartyName: string | null;
  description: string | null;
  amount: string;
  currency: string;
  categorySlug: string | null;
};

export type EnrichmentUpdateData = {
  merchantName: string;
  categorySlug?: string;
};

export type UpdateTransactionEnrichmentParams = {
  transactionId: string;
  data: EnrichmentUpdateData;
};

/**
 * Get transactions that need enrichment (no merchantName yet)
 */
export async function getTransactionsForEnrichment(
  db: Database,
  params: GetTransactionsForEnrichmentParams,
): Promise<TransactionForEnrichment[]> {
  if (params.transactionIds.length === 0) {
    return [];
  }

  return db
    .select({
      id: transactions.id,
      name: transactions.name,
      counterpartyName: transactions.counterpartyName,
      description: transactions.description,
      amount: transactions.amount,
      currency: transactions.currency,
      categorySlug: transactions.categorySlug,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.teamId, params.teamId),
        inArray(transactions.id, params.transactionIds),
        isNull(transactions.merchantName), // Only unenriched transactions
      ),
    );
}

/**
 * Update multiple transactions with enrichment data using Drizzle's bulk update
 *
 * @param db - Database connection
 * @param updates - Array of updates to apply (max 1000 for safety)
 * @throws Error if batch size exceeds limit or if updates fail
 */
export async function updateTransactionEnrichments(
  db: Database,
  updates: UpdateTransactionEnrichmentParams[],
): Promise<void> {
  if (updates.length === 0) {
    return;
  }

  // Safety: Limit batch size to prevent query size issues
  if (updates.length > 1000) {
    throw new Error(
      `Batch size too large: ${updates.length}. Maximum allowed: 1000`,
    );
  }

  // Safety: Validate input data
  for (const update of updates) {
    if (!update.transactionId?.trim()) {
      throw new Error("Invalid transactionId: cannot be empty");
    }
    if (!update.data.merchantName?.trim()) {
      throw new Error("Invalid merchantName: cannot be empty");
    }
  }

  // Helper function to build CASE statement
  const buildCaseStatement = (
    updates: UpdateTransactionEnrichmentParams[],
    getValue: (update: UpdateTransactionEnrichmentParams) => string,
  ): SQL => {
    const sqlChunks: SQL[] = [sql`(case`];

    for (const update of updates) {
      sqlChunks.push(
        sql`when ${transactions.id} = ${update.transactionId} then ${getValue(update)}`,
      );
    }

    sqlChunks.push(sql`end)`);
    return sql.join(sqlChunks, sql.raw(" "));
  };

  try {
    // Group updates by whether categorySlug needs updating
    const merchantOnlyUpdates = updates.filter((u) => !u.data.categorySlug);
    const fullUpdates = updates.filter((u) => u.data.categorySlug);

    // Update merchant names only (atomic operation)
    if (merchantOnlyUpdates.length > 0) {
      const merchantSql = buildCaseStatement(
        merchantOnlyUpdates,
        (u) => u.data.merchantName,
      );
      const ids = merchantOnlyUpdates.map((u) => u.transactionId);

      await db
        .update(transactions)
        .set({ merchantName: merchantSql })
        .where(inArray(transactions.id, ids));
    }

    // Update both merchant name and category (atomic operation)
    if (fullUpdates.length > 0) {
      const merchantSql = buildCaseStatement(
        fullUpdates,
        (u) => u.data.merchantName,
      );
      const categorySql = buildCaseStatement(
        fullUpdates,
        (u) => u.data.categorySlug!,
      );
      const ids = fullUpdates.map((u) => u.transactionId);

      await db
        .update(transactions)
        .set({
          merchantName: merchantSql,
          categorySlug: categorySql,
        })
        .where(inArray(transactions.id, ids));
    }
  } catch (error) {
    throw new Error(
      `Failed to update transaction enrichments: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
