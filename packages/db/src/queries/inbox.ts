import type { Database } from "@db/client";
import {
  inbox,
  inboxAccounts,
  inboxEmbeddings,
  transactionAttachments,
  transactionEmbeddings,
  transactionMatchSuggestions,
  transactions,
} from "@db/schema";
import { buildSearchQuery } from "@midday/db/utils/search-query";
import { logger } from "@midday/logger";
import { and, asc, desc, eq, inArray, isNotNull, ne, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm/sql/sql";

export type GetInboxParams = {
  teamId: string;
  cursor?: string | null;
  order?: string | null;
  pageSize?: number;
  q?: string | null;
  status?:
    | "new"
    | "archived"
    | "processing"
    | "done"
    | "pending"
    | "analyzing"
    | "suggested_match"
    | null;
};

export async function getInbox(db: Database, params: GetInboxParams) {
  const { teamId, cursor, order, pageSize = 20, q, status } = params;

  const whereConditions: SQL[] = [
    eq(inbox.teamId, teamId),
    ne(inbox.status, "deleted"),
  ];

  // Apply status filter
  if (status) {
    whereConditions.push(eq(inbox.status, status));
  }

  // Apply search query filter
  if (q) {
    // If the query is a number, search by amount
    if (!Number.isNaN(Number.parseInt(q))) {
      whereConditions.push(sql`${inbox.amount}::text LIKE '%' || ${q} || '%'`);
    } else {
      const query = buildSearchQuery(q);
      // Search using full-text search
      whereConditions.push(
        sql`to_tsquery('english', ${query}) @@ ${inbox.fts}`,
      );
    }
  }

  // Start building the query
  const query = db
    .select({
      id: inbox.id,
      fileName: inbox.fileName,
      filePath: inbox.filePath,
      displayName: inbox.displayName,
      transactionId: inbox.transactionId,
      amount: inbox.amount,
      currency: inbox.currency,
      contentType: inbox.contentType,
      date: inbox.date,
      status: inbox.status,
      createdAt: inbox.createdAt,
      website: inbox.website,
      description: inbox.description,
      inboxAccountId: inbox.inboxAccountId,
      inboxAccount: {
        id: inboxAccounts.id,
        email: inboxAccounts.email,
        provider: inboxAccounts.provider,
      },
      transaction: {
        id: transactions.id,
        amount: transactions.amount,
        currency: transactions.currency,
        name: transactions.name,
        date: transactions.date,
      },
    })
    .from(inbox)
    .leftJoin(transactions, eq(inbox.transactionId, transactions.id))
    .leftJoin(inboxAccounts, eq(inbox.inboxAccountId, inboxAccounts.id))
    .where(and(...whereConditions));

  // Apply sorting
  if (order === "desc") {
    query.orderBy(asc(inbox.createdAt)); // Reverse order for desc
  } else {
    query.orderBy(desc(inbox.createdAt)); // Default is descending
  }

  // Apply pagination
  const offset = cursor ? Number.parseInt(cursor, 10) : 0;
  query.limit(pageSize).offset(offset);

  // Execute query
  const data = await query;

  // Calculate next cursor
  const nextCursor =
    data && data.length === pageSize
      ? (offset + pageSize).toString()
      : undefined;

  return {
    meta: {
      cursor: nextCursor,
      hasPreviousPage: offset > 0,
      hasNextPage: data && data.length === pageSize,
    },
    data: data ?? [],
  };
}

export type GetInboxByIdParams = {
  id: string;
  teamId: string;
};

export async function getInboxById(db: Database, params: GetInboxByIdParams) {
  const { id, teamId } = params;

  const [result] = await db
    .select({
      id: inbox.id,
      fileName: inbox.fileName,
      filePath: inbox.filePath,
      displayName: inbox.displayName,
      transactionId: inbox.transactionId,
      amount: inbox.amount,
      currency: inbox.currency,
      contentType: inbox.contentType,
      date: inbox.date,
      status: inbox.status,
      createdAt: inbox.createdAt,
      website: inbox.website,
      description: inbox.description,
      inboxAccountId: inbox.inboxAccountId,
      inboxAccount: {
        id: inboxAccounts.id,
        email: inboxAccounts.email,
        provider: inboxAccounts.provider,
      },
      transaction: {
        id: transactions.id,
        amount: transactions.amount,
        currency: transactions.currency,
        name: transactions.name,
        date: transactions.date,
      },
      suggestion: {
        id: transactionMatchSuggestions.id,
        transactionId: transactionMatchSuggestions.transactionId,
        confidenceScore: transactionMatchSuggestions.confidenceScore,
        matchType: transactionMatchSuggestions.matchType,
        status: transactionMatchSuggestions.status,
      },
    })
    .from(inbox)
    .leftJoin(transactions, eq(inbox.transactionId, transactions.id))
    .leftJoin(inboxAccounts, eq(inbox.inboxAccountId, inboxAccounts.id))
    .leftJoin(
      transactionMatchSuggestions,
      and(
        eq(transactionMatchSuggestions.inboxId, inbox.id),
        eq(transactionMatchSuggestions.status, "pending"),
      ),
    )
    .where(and(eq(inbox.id, id), eq(inbox.teamId, teamId)))
    .limit(1);

  // If there's a suggestion, get the suggested transaction details
  if (result?.suggestion?.transactionId) {
    const [suggestedTransaction] = await db
      .select({
        id: transactions.id,
        name: transactions.name,
        amount: transactions.amount,
        currency: transactions.currency,
        date: transactions.date,
      })
      .from(transactions)
      .where(eq(transactions.id, result.suggestion.transactionId))
      .limit(1);

    return {
      ...result,
      suggestion: {
        ...result.suggestion,
        suggestedTransaction,
      },
    };
  }

  return result;
}

export type DeleteInboxParams = {
  id: string;
  teamId: string;
};

export async function deleteInbox(db: Database, params: DeleteInboxParams) {
  const { id, teamId } = params;

  // First get the inbox item to check if it has attachments
  const [result] = await db
    .select({
      id: inbox.id,
      transactionId: inbox.transactionId,
      attachmentId: inbox.attachmentId,
    })
    .from(inbox)
    .where(and(eq(inbox.id, id), eq(inbox.teamId, teamId)))
    .limit(1);

  if (!result) {
    throw new Error("Inbox item not found");
  }

  // Clean up transaction attachment if it exists (same logic as unmatchTransaction)
  if (result.attachmentId && result.transactionId) {
    // Delete the specific transaction attachment for this inbox item
    await db
      .delete(transactionAttachments)
      .where(
        and(
          eq(transactionAttachments.id, result.attachmentId),
          eq(transactionAttachments.teamId, teamId),
        ),
      );

    // Check if this transaction still has other attachments before resetting tax info
    const remainingAttachments = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactionAttachments)
      .where(
        and(
          eq(transactionAttachments.transactionId, result.transactionId),
          eq(transactionAttachments.teamId, teamId),
        ),
      );

    // Only reset tax rate and type if no more attachments exist for this transaction
    if (remainingAttachments[0]?.count === 0) {
      await db
        .update(transactions)
        .set({
          taxRate: null,
          taxType: null,
        })
        .where(eq(transactions.id, result.transactionId));
    }
  }

  // Mark inbox item as deleted and clear attachment/transaction references
  return db
    .update(inbox)
    .set({
      status: "deleted",
      transactionId: null,
      attachmentId: null,
    })
    .where(and(eq(inbox.id, id), eq(inbox.teamId, teamId)))
    .returning();
}

export type GetInboxSearchParams = {
  teamId: string;
  limit?: number;
  q: string | number;
};

export type GetInboxSuggestionsParams = {
  teamId: string;
  transactionId?: string;
  limit?: number;
};

export async function getInboxSearch(
  db: Database,
  params: GetInboxSearchParams,
) {
  const { teamId, q, limit = 10 } = params;

  const whereConditions: SQL[] = [
    eq(inbox.teamId, teamId),
    ne(inbox.status, "deleted"),
  ];

  // Apply search query filter only if query is provided
  if (q && String(q).trim() !== "") {
    if (!Number.isNaN(Number.parseInt(String(q)))) {
      // If the query is a number, search by amount
      whereConditions.push(
        sql`${inbox.amount}::text LIKE '%' || ${String(q)} || '%'`,
      );
    } else {
      // Search using full-text search
      const query = buildSearchQuery(String(q));
      whereConditions.push(
        sql`to_tsquery('english', ${query}) @@ ${inbox.fts}`,
      );
    }
  }

  // Execute query
  const data = await db
    .select({
      id: inbox.id,
      createdAt: inbox.createdAt,
      fileName: inbox.fileName,
      amount: inbox.amount,
      currency: inbox.currency,
      filePath: inbox.filePath,
      contentType: inbox.contentType,
      date: inbox.date,
      displayName: inbox.displayName,
      size: inbox.size,
      description: inbox.description,
    })
    .from(inbox)
    .where(and(...whereConditions))
    .orderBy(
      // If no query provided, order by most recent first, otherwise by creation date
      q && String(q).trim() !== ""
        ? asc(inbox.createdAt)
        : desc(inbox.createdAt),
    )
    .limit(limit);

  return data;
}

export async function getInboxSuggestions(
  db: Database,
  params: GetInboxSuggestionsParams,
) {
  try {
    const { teamId, transactionId, limit = 3 } = params;

    const whereConditions: SQL[] = [
      eq(inbox.teamId, teamId),
      ne(inbox.status, "deleted"),
      // Exclude items that are already matched to other transactions
      sql`${inbox.transactionId} IS NULL`,
    ];

    // If we have transaction context, use it for smart suggestions
    if (transactionId) {
      // Get transaction details for context-aware matching
      const transactionData = await db
        .select({
          id: transactions.id,
          name: transactions.name,
          amount: transactions.amount,
          currency: transactions.currency,
          baseAmount: transactions.baseAmount,
          baseCurrency: transactions.baseCurrency,
          date: transactions.date,
          counterpartyName: transactions.counterpartyName,
          description: transactions.description,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.id, transactionId),
            eq(transactions.teamId, teamId),
          ),
        )
        .limit(1);

      if (transactionData.length > 0) {
        const transaction = transactionData[0]!;

        // Try to get transaction embedding for semantic matching
        const transactionEmbeddingData = await db
          .select({
            embedding: transactionEmbeddings.embedding,
            sourceText: transactionEmbeddings.sourceText,
          })
          .from(transactionEmbeddings)
          .where(
            and(
              eq(transactionEmbeddings.transactionId, transactionId),
              eq(transactionEmbeddings.teamId, teamId),
            ),
          )
          .limit(1);

        // If we have embeddings, use semantic similarity with financial context
        if (
          transactionEmbeddingData.length > 0 &&
          transactionEmbeddingData[0]!.embedding
        ) {
          // Pre-calculate values to avoid parameter type issues
          const transactionAmount = transaction.amount ?? 0;
          const transactionCurrency = transaction.currency ?? "";
          const tier2Threshold = Math.max(
            100,
            Math.abs(transactionAmount) * 0.2,
          );
          const tier3Threshold = Math.max(
            200,
            Math.abs(transactionAmount) * 0.4,
          );

          const smartSuggestions = await db
            .select({
              id: inbox.id,
              createdAt: inbox.createdAt,
              fileName: inbox.fileName,
              amount: inbox.amount,
              currency: inbox.currency,
              filePath: inbox.filePath,
              contentType: inbox.contentType,
              date: inbox.date,
              displayName: inbox.displayName,
              size: inbox.size,
              description: inbox.description,
              // Embedding similarity score (converted from cosine distance)
              embeddingScore:
                sql<number>`1 - (${transactionEmbeddings.embedding} <-> ${inboxEmbeddings.embedding})`.as(
                  "embedding_score",
                ),
            })
            .from(inbox)
            .innerJoin(
              inboxEmbeddings,
              and(
                eq(inboxEmbeddings.inboxId, inbox.id),
                isNotNull(inboxEmbeddings.embedding),
              ),
            )
            .innerJoin(
              transactionEmbeddings,
              and(
                eq(transactionEmbeddings.transactionId, transactionId),
                isNotNull(transactionEmbeddings.embedding),
              ),
            )
            .where(
              and(
                ...whereConditions,
                // Use proven transaction matching tiers with higher thresholds:
                sql`(
                 -- TIER 1: Perfect financial matches (exact amount + currency) with decent semantic relevance
                 ((ABS(COALESCE(${inbox.amount}, 0)) = ABS(${sql.param(transactionAmount)}) 
                   AND COALESCE(${inbox.currency}, '') = ${sql.param(transactionCurrency)})
                   AND (${transactionEmbeddings.embedding} <-> ${inboxEmbeddings.embedding}) < 0.7)
                 OR
                 -- TIER 2: Strong semantic matches (< 0.35 distance) with exact amounts  
                  ((${transactionEmbeddings.embedding} <-> ${inboxEmbeddings.embedding}) < 0.35
                  AND ABS(COALESCE(${inbox.amount}, 0)) = ABS(${sql.param(transactionAmount)}))
                 OR
                 -- TIER 3: Very strong semantic matches (< 0.25 distance) with reasonable financial alignment
                  ((${transactionEmbeddings.embedding} <-> ${inboxEmbeddings.embedding}) < 0.25
                  AND ABS(COALESCE(${inbox.amount}, 0) - ${sql.param(transactionAmount)}) < ${sql.param(tier2Threshold)})
               )`,
              ),
            )
            .orderBy(
              // Use proven transaction matching weights and add confidence filtering
              desc(sql`
               CASE
                 -- Calculate base confidence score using proven weights
                 WHEN (
                   ((1 - (${transactionEmbeddings.embedding} <-> ${inboxEmbeddings.embedding})) * 0.45) +
                   ((CASE 
                     WHEN ${inbox.amount} IS NULL THEN 0.0
                     WHEN ${sql.param(transactionAmount)} = 0 THEN 0.0
                     WHEN abs(${inbox.amount}) = abs(${sql.param(transactionAmount)}) THEN 1.0
                     WHEN abs(abs(${inbox.amount}) - abs(${sql.param(transactionAmount)})) / GREATEST(abs(${inbox.amount}), abs(${sql.param(transactionAmount)})) <= 0.05 THEN 0.9
                     WHEN abs(abs(${inbox.amount}) - abs(${sql.param(transactionAmount)})) / GREATEST(abs(${inbox.amount}), abs(${sql.param(transactionAmount)})) <= 0.15 THEN 0.7
                     ELSE 0.3
                   END) * 0.35) +
                   ((CASE 
                     WHEN ${inbox.currency} = ${sql.param(transactionCurrency)} THEN 1.0
                     WHEN ${inbox.currency} IS NULL OR ${sql.param(transactionCurrency)} = '' THEN 0.5
                     ELSE 0.2
                   END) * 0.15) +
                   (0.5 * 0.05)
                 ) >= 0.6 -- Only show suggestions with 60%+ confidence
                 THEN (
                   -- Boost perfect financial matches
                   CASE 
                     WHEN (ABS(COALESCE(${inbox.amount}, 0)) = ABS(${sql.param(transactionAmount)}) 
                           AND COALESCE(${inbox.currency}, '') = ${sql.param(transactionCurrency)})
                     THEN 1.0
                     ELSE (
                       ((1 - (${transactionEmbeddings.embedding} <-> ${inboxEmbeddings.embedding})) * 0.45) +
                       ((CASE 
                         WHEN ${inbox.amount} IS NULL THEN 0.0
                         WHEN ${sql.param(transactionAmount)} = 0 THEN 0.0
                         WHEN abs(${inbox.amount}) = abs(${sql.param(transactionAmount)}) THEN 1.0
                         WHEN abs(abs(${inbox.amount}) - abs(${sql.param(transactionAmount)})) / GREATEST(abs(${inbox.amount}), abs(${sql.param(transactionAmount)})) <= 0.05 THEN 0.9
                         WHEN abs(abs(${inbox.amount}) - abs(${sql.param(transactionAmount)})) / GREATEST(abs(${inbox.amount}), abs(${sql.param(transactionAmount)})) <= 0.15 THEN 0.7
                         ELSE 0.3
                       END) * 0.35) +
                       ((CASE 
                         WHEN ${inbox.currency} = ${sql.param(transactionCurrency)} THEN 1.0
                         WHEN ${inbox.currency} IS NULL OR ${sql.param(transactionCurrency)} = '' THEN 0.5
                         ELSE 0.2
                       END) * 0.15) +
                       (0.5 * 0.05)
                     )
                   END
                 )
                 ELSE 0.0 -- Filter out low confidence matches
               END
             `),
              // Secondary sort by recency
              desc(inbox.createdAt),
            )
            .limit(limit);

          return smartSuggestions;
        }

        // Fallback to basic matching when no embeddings available
        const transactionAmount = transaction.amount ?? 0;
        const transactionCurrency = transaction.currency ?? "";
        const transactionName = transaction.name ?? "";
        const similarAmountThreshold = Math.max(
          50,
          Math.abs(transactionAmount) * 0.1,
        );
        const closeAmountThreshold = Math.max(
          10,
          Math.abs(transactionAmount) * 0.05,
        );

        const basicSuggestions = await db
          .select({
            id: inbox.id,
            createdAt: inbox.createdAt,
            fileName: inbox.fileName,
            amount: inbox.amount,
            currency: inbox.currency,
            filePath: inbox.filePath,
            contentType: inbox.contentType,
            date: inbox.date,
            displayName: inbox.displayName,
            size: inbox.size,
            description: inbox.description,
          })
          .from(inbox)
          .where(
            and(
              ...whereConditions,
              // Higher quality basic financial matching when no embeddings
              sql`(
               -- TIER 1: Perfect financial matches (exact amount + currency)
               (ABS(COALESCE(${inbox.amount}, 0)) = ABS(${sql.param(transactionAmount)}) 
                AND COALESCE(${inbox.currency}, '') = ${sql.param(transactionCurrency)})
               OR
               -- TIER 2: Exact amount matches (any currency) - very reliable
               (ABS(COALESCE(${inbox.amount}, 0)) = ABS(${sql.param(transactionAmount)}))
               OR
               -- TIER 3: Strong text similarity with reasonable amount match (within 5%)
               (${inbox.displayName} IS NOT NULL 
                AND ${sql.param(transactionName)} != ''
                AND similarity(lower(${inbox.displayName}), lower(${sql.param(transactionName)})) > 0.6
                AND ABS(COALESCE(${inbox.amount}, 0) - ${sql.param(transactionAmount)}) < ${sql.param(closeAmountThreshold)})
             )`,
            ),
          )
          .orderBy(
            // Prioritize perfect matches, then exact amounts, then similarity
            sql`
             CASE 
               -- Perfect financial match gets highest priority
               WHEN (ABS(COALESCE(${inbox.amount}, 0)) = ABS(${sql.param(transactionAmount)}) 
                     AND COALESCE(${inbox.currency}, '') = ${sql.param(transactionCurrency)}) THEN 1
               -- Exact amount match gets second priority  
               WHEN ABS(COALESCE(${inbox.amount}, 0)) = ABS(${sql.param(transactionAmount)}) THEN 2
               -- High text similarity with close amount gets third priority
               WHEN (${inbox.displayName} IS NOT NULL 
                     AND ${sql.param(transactionName)} != ''
                     AND similarity(lower(${inbox.displayName}), lower(${sql.param(transactionName)})) > 0.6) THEN 3
               ELSE 4
             END
           `,
            desc(inbox.createdAt),
          )
          .limit(limit);

        return basicSuggestions;
      }
    }

    // Fallback: return recent unmatched items if no transaction context
    const data = await db
      .select({
        id: inbox.id,
        createdAt: inbox.createdAt,
        fileName: inbox.fileName,
        amount: inbox.amount,
        currency: inbox.currency,
        filePath: inbox.filePath,
        contentType: inbox.contentType,
        date: inbox.date,
        displayName: inbox.displayName,
        size: inbox.size,
        description: inbox.description,
      })
      .from(inbox)
      .where(and(...whereConditions))
      .orderBy(desc(inbox.createdAt))
      .limit(limit);

    return data;
  } catch (error) {
    console.log(error);
    return [];
  }
}

export type UpdateInboxParams = {
  id: string;
  teamId: string;
  status?:
    | "deleted"
    | "new"
    | "archived"
    | "processing"
    | "done"
    | "pending"
    | "analyzing"
    | "suggested_match";
};

export async function updateInbox(db: Database, params: UpdateInboxParams) {
  const { id, teamId, ...data } = params;

  // Special handling for status: "deleted" - need to clean up transaction attachments
  if (data.status === "deleted") {
    // First get the inbox item to check if it has attachments
    const [result] = await db
      .select({
        id: inbox.id,
        transactionId: inbox.transactionId,
        attachmentId: inbox.attachmentId,
      })
      .from(inbox)
      .where(and(eq(inbox.id, id), eq(inbox.teamId, teamId)))
      .limit(1);

    if (result?.attachmentId && result?.transactionId) {
      // Delete the specific transaction attachment for this inbox item
      await db
        .delete(transactionAttachments)
        .where(
          and(
            eq(transactionAttachments.id, result.attachmentId),
            eq(transactionAttachments.teamId, teamId),
          ),
        );

      // Check if this transaction still has other attachments before resetting tax info
      const remainingAttachments = await db
        .select({ count: sql<number>`count(*)` })
        .from(transactionAttachments)
        .where(
          and(
            eq(transactionAttachments.transactionId, result.transactionId),
            eq(transactionAttachments.teamId, teamId),
          ),
        );

      // Only reset tax rate and type if no more attachments exist for this transaction
      if (remainingAttachments[0]?.count === 0) {
        await db
          .update(transactions)
          .set({
            taxRate: null,
            taxType: null,
          })
          .where(eq(transactions.id, result.transactionId));
      }
    }
  }

  // Update the inbox record
  await db
    .update(inbox)
    .set(data)
    .where(and(eq(inbox.id, id), eq(inbox.teamId, teamId)));

  // Return the updated record with transaction data
  const [result] = await db
    .select({
      id: inbox.id,
      fileName: inbox.fileName,
      filePath: inbox.filePath,
      displayName: inbox.displayName,
      transactionId: inbox.transactionId,
      amount: inbox.amount,
      currency: inbox.currency,
      contentType: inbox.contentType,
      date: inbox.date,
      status: inbox.status,
      createdAt: inbox.createdAt,
      website: inbox.website,
      description: inbox.description,
      transaction: {
        id: transactions.id,
        amount: transactions.amount,
        currency: transactions.currency,
        name: transactions.name,
        date: transactions.date,
      },
    })
    .from(inbox)
    .leftJoin(transactions, eq(inbox.transactionId, transactions.id))
    .where(and(eq(inbox.id, id), eq(inbox.teamId, teamId)))
    .limit(1);

  return result;
}

export type MatchTransactionParams = {
  id: string;
  transactionId: string;
  teamId: string;
};

export async function matchTransaction(
  db: Database,
  params: MatchTransactionParams,
) {
  const { id, transactionId, teamId } = params;

  // Get inbox data
  const [result] = await db
    .select({
      id: inbox.id,
      contentType: inbox.contentType,
      filePath: inbox.filePath,
      size: inbox.size,
      fileName: inbox.fileName,
      taxRate: inbox.taxRate,
      taxType: inbox.taxType,
    })
    .from(inbox)
    .where(and(eq(inbox.id, id), eq(inbox.teamId, teamId)))
    .limit(1);

  if (!result) return null;

  // Insert transaction attachment
  const [attachmentData] = await db
    .insert(transactionAttachments)
    .values({
      type: result.contentType ?? "",
      path: result.filePath ?? [],
      transactionId,
      size: result.size ?? 0,
      name: result.fileName ?? "",
      teamId,
    })
    .returning({ id: transactionAttachments.id });

  // Update transaction with tax rate and type
  if (result.taxRate && result.taxType) {
    await db
      .update(transactions)
      .set({
        taxRate: result.taxRate,
        taxType: result.taxType,
      })
      .where(eq(transactions.id, transactionId));
  }

  if (attachmentData) {
    // Update inbox with attachment and transaction IDs
    await db
      .update(inbox)
      .set({
        attachmentId: attachmentData.id,
        transactionId: transactionId,
        status: "done",
      })
      .where(and(eq(inbox.id, id), eq(inbox.teamId, teamId)));
  }

  // Return updated inbox with transaction data
  const [data] = await db
    .select({
      id: inbox.id,
      fileName: inbox.fileName,
      filePath: inbox.filePath,
      displayName: inbox.displayName,
      transactionId: inbox.transactionId,
      amount: inbox.amount,
      currency: inbox.currency,
      contentType: inbox.contentType,
      date: inbox.date,
      status: inbox.status,
      createdAt: inbox.createdAt,
      website: inbox.website,
      description: inbox.description,
      transaction: {
        id: transactions.id,
        amount: transactions.amount,
        currency: transactions.currency,
        name: transactions.name,
        date: transactions.date,
      },
    })
    .from(inbox)
    .leftJoin(transactions, eq(inbox.transactionId, transactions.id))
    .where(and(eq(inbox.id, id), eq(inbox.teamId, teamId)))
    .limit(1);

  return data;
}

export type UnmatchTransactionParams = {
  id: string;
  teamId: string;
};

export async function unmatchTransaction(
  db: Database,
  params: UnmatchTransactionParams & { userId?: string },
) {
  const { id, teamId, userId } = params;

  // Get inbox data
  const [result] = await db
    .select({
      id: inbox.id,
      transactionId: inbox.transactionId,
      attachmentId: inbox.attachmentId,
    })
    .from(inbox)
    .where(and(eq(inbox.id, id), eq(inbox.teamId, teamId)))
    .limit(1);

  // LEARNING FEEDBACK: Find the original match suggestion to mark as incorrect
  if (result?.transactionId) {
    // Look for the match suggestion that led to this pairing
    const [originalSuggestion] = await db
      .select({
        id: transactionMatchSuggestions.id,
        status: transactionMatchSuggestions.status,
        matchType: transactionMatchSuggestions.matchType,
        confidenceScore: transactionMatchSuggestions.confidenceScore,
      })
      .from(transactionMatchSuggestions)
      .where(
        and(
          eq(transactionMatchSuggestions.inboxId, id),
          eq(transactionMatchSuggestions.transactionId, result.transactionId),
          eq(transactionMatchSuggestions.teamId, teamId),
          eq(transactionMatchSuggestions.status, "confirmed"),
        ),
      )
      .orderBy(desc(transactionMatchSuggestions.createdAt))
      .limit(1);

    // Mark the suggestion as "unmatched" to provide negative feedback for learning
    if (originalSuggestion) {
      await db
        .update(transactionMatchSuggestions)
        .set({
          status: "unmatched", // New status for post-match removal
          userActionAt: new Date().toISOString(),
          userId: userId || null,
        })
        .where(eq(transactionMatchSuggestions.id, originalSuggestion.id));

      // Log for debugging/monitoring
      logger.info("📚 UNMATCH LEARNING FEEDBACK", {
        teamId,
        inboxId: id,
        transactionId: result.transactionId,
        originalMatchType: originalSuggestion.matchType,
        originalConfidence: Number(originalSuggestion.confidenceScore),
        originalStatus: originalSuggestion.status,
        message:
          "User unmatched a previously confirmed/auto-matched pair - negative feedback for learning",
      });
    }
  }

  // Update inbox record
  await db
    .update(inbox)
    .set({
      transactionId: null,
      attachmentId: null,
      status: "pending",
    })
    .where(and(eq(inbox.id, id), eq(inbox.teamId, teamId)));

  // Delete only the specific transaction attachment for this inbox item
  if (result?.attachmentId) {
    await db
      .delete(transactionAttachments)
      .where(
        and(
          eq(transactionAttachments.id, result.attachmentId),
          eq(transactionAttachments.teamId, teamId),
        ),
      );
  }

  // Check if this transaction still has other attachments before resetting tax info
  if (result?.transactionId) {
    const remainingAttachments = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactionAttachments)
      .where(
        and(
          eq(transactionAttachments.transactionId, result.transactionId),
          eq(transactionAttachments.teamId, teamId),
        ),
      );

    // Only reset tax rate and type if no more attachments exist for this transaction
    if (remainingAttachments[0]?.count === 0) {
      await db
        .update(transactions)
        .set({
          taxRate: null,
          taxType: null,
        })
        .where(eq(transactions.id, result.transactionId));
    }
  }

  // Return updated inbox with transaction data
  return db
    .select({
      id: inbox.id,
      fileName: inbox.fileName,
      filePath: inbox.filePath,
      displayName: inbox.displayName,
      transactionId: inbox.transactionId,
      amount: inbox.amount,
      currency: inbox.currency,
      contentType: inbox.contentType,
      date: inbox.date,
      status: inbox.status,
      createdAt: inbox.createdAt,
      website: inbox.website,
      description: inbox.description,
      transaction: {
        id: transactions.id,
        amount: transactions.amount,
        currency: transactions.currency,
        name: transactions.name,
        date: transactions.date,
      },
    })
    .from(inbox)
    .leftJoin(transactions, eq(inbox.transactionId, transactions.id))
    .where(and(eq(inbox.id, id), eq(inbox.teamId, teamId)))
    .limit(1);
}

export type GetInboxByFilePathParams = {
  filePath: string[];
  teamId: string;
};

export async function getInboxByFilePath(
  db: Database,
  params: GetInboxByFilePathParams,
) {
  const { filePath, teamId } = params;

  const [result] = await db
    .select({
      id: inbox.id,
      status: inbox.status,
    })
    .from(inbox)
    .where(
      and(
        eq(inbox.filePath, filePath),
        eq(inbox.teamId, teamId),
        ne(inbox.status, "deleted"),
      ),
    )
    .limit(1);

  return result;
}

export type CreateInboxParams = {
  displayName: string;
  teamId: string;
  filePath: string[];
  fileName: string;
  contentType: string;
  size: number;
  referenceId?: string;
  website?: string;
  inboxAccountId?: string;
  status?:
    | "new"
    | "analyzing"
    | "pending"
    | "done"
    | "processing"
    | "archived"
    | "deleted";
};

export async function createInbox(db: Database, params: CreateInboxParams) {
  const {
    displayName,
    teamId,
    filePath,
    fileName,
    contentType,
    size,
    referenceId,
    website,
    inboxAccountId,
    status = "new",
  } = params;

  const [result] = await db
    .insert(inbox)
    .values({
      displayName,
      teamId,
      filePath,
      fileName,
      contentType,
      size,
      referenceId,
      website,
      inboxAccountId,
      status,
    })
    .returning({
      id: inbox.id,
      fileName: inbox.fileName,
      filePath: inbox.filePath,
      displayName: inbox.displayName,
      transactionId: inbox.transactionId,
      amount: inbox.amount,
      currency: inbox.currency,
      contentType: inbox.contentType,
      date: inbox.date,
      status: inbox.status,
      createdAt: inbox.createdAt,
      website: inbox.website,
      description: inbox.description,
      referenceId: inbox.referenceId,
      size: inbox.size,
    });

  return result;
}

export type UpdateInboxWithProcessedDataParams = {
  id: string;
  amount?: number;
  currency?: string;
  displayName?: string;
  website?: string;
  date?: string;
  taxAmount?: number;
  taxRate?: number;
  taxType?: string;
  type?: "invoice" | "expense" | null;
  status?: "pending" | "new" | "archived" | "processing" | "done" | "deleted";
};

export async function updateInboxWithProcessedData(
  db: Database,
  params: UpdateInboxWithProcessedDataParams,
) {
  const { id, ...updateData } = params;

  const [result] = await db
    .update(inbox)
    .set(updateData)
    .where(eq(inbox.id, id))
    .returning({
      id: inbox.id,
      fileName: inbox.fileName,
      filePath: inbox.filePath,
      displayName: inbox.displayName,
      transactionId: inbox.transactionId,
      amount: inbox.amount,
      currency: inbox.currency,
      contentType: inbox.contentType,
      date: inbox.date,
      status: inbox.status,
      createdAt: inbox.createdAt,
      website: inbox.website,
      description: inbox.description,
      referenceId: inbox.referenceId,
      size: inbox.size,
      taxAmount: inbox.taxAmount,
      taxRate: inbox.taxRate,
      taxType: inbox.taxType,
      type: inbox.type,
    });

  return result;
}
