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
import { and, asc, desc, eq, ne, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm/sql/sql";

// Scoring functions for suggestion ranking
function calculateAmountScore(
  item1: { amount: number | null },
  item2: { amount: number | null },
): number {
  const amount1 = item1.amount;
  const amount2 = item2.amount;

  if (amount1 === null || amount2 === null) return 0.0;

  const abs1 = Math.abs(amount1);
  const abs2 = Math.abs(amount2);

  if (abs1 === abs2) return 1.0;

  const diff = Math.abs(abs1 - abs2);
  const max = Math.max(abs1, abs2);
  const percentDiff = diff / max;

  if (percentDiff <= 0.05) return 0.9;
  if (percentDiff <= 0.15) return 0.7;
  return 0.3;
}

function calculateCurrencyScore(
  currency1?: string,
  currency2?: string,
): number {
  if (!currency1 || !currency2) return 0.5;
  if (currency1 === currency2) return 1.0;
  return 0.3;
}

function calculateDateScore(
  inboxDate: string,
  transactionDate: string,
): number {
  const inboxDateObj = new Date(inboxDate);
  const transactionDateObj = new Date(transactionDate);
  const diffTime = Math.abs(
    transactionDateObj.getTime() - inboxDateObj.getTime(),
  );
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 1.0;
  if (diffDays <= 1) return 0.9;
  if (diffDays <= 3) return 0.8;
  if (diffDays <= 7) return 0.7;
  if (diffDays <= 14) return 0.6;
  return 0.5;
}

export type GetInboxParams = {
  teamId: string;
  cursor?: string | null;
  order?: string | null;
  sort?: string | null;
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
    | "no_match"
    | null;
};

export async function getInbox(db: Database, params: GetInboxParams) {
  const { teamId, cursor, order, sort, pageSize = 20, q, status } = params;

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
      // Use both FTS and ILIKE for better special character support
      const query = buildSearchQuery(q);
      whereConditions.push(
        sql`(
          to_tsquery('english', ${query}) @@ ${inbox.fts}
          OR ${inbox.displayName} ILIKE '%' || ${q} || '%'
          OR ${inbox.fileName} ILIKE '%' || ${q} || '%'
          OR ${inbox.description} ILIKE '%' || ${q} || '%'
        )`,
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
  if (sort === "alphabetical") {
    if (order === "desc") {
      query.orderBy(desc(inbox.displayName));
    } else {
      query.orderBy(asc(inbox.displayName));
    }
  } else {
    // Default to date sorting
    if (order === "desc") {
      query.orderBy(asc(inbox.createdAt)); // Reverse order for desc
    } else {
      query.orderBy(desc(inbox.createdAt)); // Default is descending
    }
  }

  // Apply pagination
  const offset = cursor ? Number.parseInt(cursor, 10) : 0;
  query.limit(pageSize).offset(offset);

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
  q?: string; // Search query (text or amount)
  transactionId?: string; // For AI suggestions
};

export async function getInboxSearch(
  db: Database,
  params: GetInboxSearchParams,
) {
  try {
    const { teamId, q, transactionId, limit = 10 } = params;

    const whereConditions: SQL[] = [
      eq(inbox.teamId, teamId),
      ne(inbox.status, "deleted"),
      // Exclude items that are already matched to other transactions
      sql`${inbox.transactionId} IS NULL`,
    ];

    // PRIORITY 1: User is searching with query
    if (q && q.trim().length > 0) {
      const searchTerm = q.trim();
      const searchQuery = buildSearchQuery(searchTerm); // Use FTS format

      logger.info("🔍 SEARCH DEBUG:", {
        searchTerm,
        searchQuery,
        teamId,
        limit,
      });

      // Check if search term is a number (for amount searching)
      const numericSearch = Number.parseFloat(
        searchTerm.replace(/[^\d.-]/g, ""),
      );

      const isNumericSearch =
        !Number.isNaN(numericSearch) && Number.isFinite(numericSearch);

      if (isNumericSearch) {
        // Search by amount (exact match or close match within 10%)
        const tolerance = Math.max(1, Math.abs(numericSearch) * 0.1);
        whereConditions.push(
          sql`(
            to_tsquery('english', ${searchQuery}) @@ ${inbox.fts}
            OR ABS(COALESCE(${inbox.amount}, 0) - ${numericSearch}) <= ${tolerance}
            OR ${inbox.displayName} ILIKE '%' || ${searchTerm} || '%'
            OR ${inbox.fileName} ILIKE '%' || ${searchTerm} || '%'
            OR ${inbox.description} ILIKE '%' || ${searchTerm} || '%'
          )`,
        );
      } else {
        // Text-only search using both FTS and ILIKE for better special character support
        whereConditions.push(
          sql`(
            to_tsquery('english', ${searchQuery}) @@ ${inbox.fts}
            OR ${inbox.displayName} ILIKE '%' || ${searchTerm} || '%'
            OR ${inbox.fileName} ILIKE '%' || ${searchTerm} || '%'
            OR ${inbox.description} ILIKE '%' || ${searchTerm} || '%'
          )`,
        );
      }

      // For search, return results ordered by date (most recent first)
      const searchResults = await db
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
        .orderBy(desc(inbox.date), desc(inbox.createdAt)) // Most recent first
        .limit(limit);

      logger.info("🎯 SEARCH RESULTS:", {
        searchTerm,
        resultsCount: searchResults.length,
        results: searchResults.slice(0, 3).map((r) => ({
          id: r.id,
          displayName: r.displayName,
          amount: r.amount,
          currency: r.currency,
        })),
      });

      return searchResults;
    }

    // PRIORITY 2: AI suggestions for transaction
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

        // Check if transaction already has attachments - if so, don't show suggestions
        const [hasAttachments] = await db
          .select({ count: sql`count(*)` })
          .from(transactionAttachments)
          .where(
            and(
              eq(transactionAttachments.transactionId, transactionId),
              eq(transactionAttachments.teamId, teamId),
            ),
          );

        const attachmentCount = hasAttachments?.count
          ? Number(hasAttachments.count)
          : 0;

        if (attachmentCount > 0) {
          return [];
        }

        // Use the same successful approach as batch-process-matching
        // Get candidates first, then score them with the same logic that works
        const candidates = await db
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
            baseAmount: inbox.baseAmount,
            baseCurrency: inbox.baseCurrency,
            embeddingScore:
              sql<number>`(${transactionEmbeddings.embedding} <-> ${inboxEmbeddings.embedding})`.as(
                "embedding_score",
              ),
          })
          .from(inbox)
          .innerJoin(inboxEmbeddings, eq(inbox.id, inboxEmbeddings.inboxId))
          .crossJoin(transactionEmbeddings)
          .where(
            and(
              ...whereConditions,
              eq(transactionEmbeddings.transactionId, transactionId),
              // More permissive threshold for manual suggestions (80%+)
              sql`(${transactionEmbeddings.embedding} <-> ${inboxEmbeddings.embedding}) < 0.2`,
              // Very wide date range for manual suggestions (full year)
              sql`${inbox.date} BETWEEN (${sql.param(transaction.date)}::date - INTERVAL '365 days') 
                  AND (${sql.param(transaction.date)}::date + INTERVAL '90 days')`,
            ),
          )
          .orderBy(
            sql`(${transactionEmbeddings.embedding} <-> ${inboxEmbeddings.embedding})`,
          )
          .limit(20); // Get more candidates for better scoring

        logger.info(
          "🔍 Main candidates found:",
          candidates.length,
          candidates.map((c) => ({
            displayName: c.displayName,
            amount: c.amount,
            currency: c.currency,
            embeddingScore: c.embeddingScore,
            semanticSimilarity: (1 - c.embeddingScore).toFixed(3),
          })),
        );

        if (candidates.length > 0) {
          // Score candidates using the same logic as successful batch-process-matching
          const scoredCandidates = candidates.map((candidate) => {
            const embeddingScore = Math.max(0, 1 - candidate.embeddingScore);
            const amountScore = calculateAmountScore(candidate, transaction);
            const currencyScore = calculateCurrencyScore(
              candidate.currency || undefined,
              transaction.currency || undefined,
            );
            const dateScore = calculateDateScore(
              candidate.date!,
              transaction.date,
            );

            // Same confidence calculation as successful matching
            let confidenceScore =
              embeddingScore * 0.5 + // Same weights as successful matching
              amountScore * 0.35 +
              currencyScore * 0.1 +
              dateScore * 0.05;

            // Apply same currency penalty reduction for high semantic matches
            if (
              candidate.currency !== transaction.currency &&
              currencyScore < 0.8
            ) {
              const currencyPenalty = embeddingScore >= 0.85 ? 0.92 : 0.85;
              confidenceScore *= currencyPenalty;
            }

            return {
              ...candidate,
              confidenceScore,
              embeddingScore,
              amountScore,
              currencyScore,
              dateScore,
            };
          });

          // Sort by confidence score first, then by date (more recent first) for ties
          const sortedSuggestions = scoredCandidates
            .sort((a, b) => {
              const confidenceDiff = b.confidenceScore - a.confidenceScore;
              // If confidence scores are very close (within 1%), use date as tiebreaker
              if (Math.abs(confidenceDiff) < 0.01) {
                const dateA = new Date(a.date || 0).getTime();
                const dateB = new Date(b.date || 0).getTime();
                return dateB - dateA; // More recent first
              }
              return confidenceDiff;
            })
            .slice(0, limit);

          logger.info(
            "🎯 Found and scored suggestions:",
            sortedSuggestions.length,
            sortedSuggestions.map((s) => ({
              displayName: s.displayName,
              amount: s.amount,
              confidence: s.confidenceScore,
            })),
          );

          return sortedSuggestions;
        }

        // No matches found
        return [];
      }
    }

    // PRIORITY 3: Recent unmatched items
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
    logger.error("Error in getInboxSearch:", error);
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

  // Get inbox data and check if already matched
  const [result] = await db
    .select({
      id: inbox.id,
      contentType: inbox.contentType,
      filePath: inbox.filePath,
      size: inbox.size,
      fileName: inbox.fileName,
      taxRate: inbox.taxRate,
      taxType: inbox.taxType,
      transactionId: inbox.transactionId, // Check if already matched
      status: inbox.status,
    })
    .from(inbox)
    .where(and(eq(inbox.id, id), eq(inbox.teamId, teamId)))
    .limit(1);

  if (!result) return null;

  // Check if inbox item is already matched
  if (result.transactionId) {
    throw new Error("Inbox item is already matched to a transaction");
  }

  // Check if the target transaction is already matched to another inbox item
  const [existingMatch] = await db
    .select({ id: inbox.id })
    .from(inbox)
    .where(
      and(
        eq(inbox.transactionId, transactionId),
        eq(inbox.teamId, teamId),
        ne(inbox.id, id), // Not the same inbox item
      ),
    )
    .limit(1);

  if (existingMatch) {
    throw new Error("Transaction is already matched to another inbox item");
  }

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
