import { createLoggerWithContext } from "@midday/logger";
import type { Database, DatabaseOrTransaction } from "../client";
import {
  inbox,
  inboxAccounts,
  inboxBlocklist,
  transactionAttachments,
  transactionMatchSuggestions,
  transactions,
} from "../schema";

const logger = createLoggerWithContext("inbox");

import { and, asc, desc, eq, inArray, lt, ne, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm/sql/sql";
import { separateBlocklistEntries } from "../utils/blocklist";
import { buildSearchQuery } from "../utils/search-query";
import {
  calculateAmountScore as calculateUnifiedAmountScore,
  calculateCurrencyScore as calculateUnifiedCurrencyScore,
  calculateDateScore as calculateUnifiedDateScore,
  calculateNameScore as calculateUnifiedNameScore,
  scoreMatch,
} from "../utils/transaction-matching";

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
    | "other"
    | null;
  tab?: "all" | "other" | null;
};

export async function getInbox(db: Database, params: GetInboxParams) {
  const { teamId, cursor, order, sort, pageSize = 20, q, status, tab } = params;

  const whereConditions: SQL[] = [
    eq(inbox.teamId, teamId),
    ne(inbox.status, "deleted"),
    // Filter out grouped items - only show primary items (where groupedInboxId IS NULL)
    // or items that are themselves the primary (where id matches their own groupedInboxId)
    sql`(${inbox.groupedInboxId} IS NULL)`,
  ];

  // Apply blocklist filter
  const blocklistEntries = await db
    .select({
      type: inboxBlocklist.type,
      value: inboxBlocklist.value,
    })
    .from(inboxBlocklist)
    .where(eq(inboxBlocklist.teamId, teamId));

  if (blocklistEntries.length > 0) {
    const { blockedDomains, blockedEmails } =
      separateBlocklistEntries(blocklistEntries);

    // Filter out blocked domains (website field contains domain)
    if (blockedDomains.length > 0) {
      // Build NOT IN condition for blocked domains
      const domainConditions = blockedDomains.map(
        (domain: string) => sql`LOWER(${inbox.website}) = LOWER(${domain})`,
      );
      whereConditions.push(
        sql`(${inbox.website} IS NULL OR NOT (${sql.join(
          domainConditions,
          sql` OR `,
        )}))`,
      );
    }

    // Filter out blocked email addresses (senderEmail field)
    if (blockedEmails.length > 0) {
      const emailConditions = blockedEmails.map(
        (email: string) => sql`LOWER(${inbox.senderEmail}) = LOWER(${email})`,
      );
      whereConditions.push(
        sql`(${inbox.senderEmail} IS NULL OR NOT (${sql.join(
          emailConditions,
          sql` OR `,
        )}))`,
      );
    }
  }

  // Apply status filter
  if (status) {
    whereConditions.push(eq(inbox.status, status));
  }

  // Apply tab filter
  if (tab === "other") {
    // Show only "other" type documents (non-financial)
    whereConditions.push(
      or(eq(inbox.type, "other"), eq(inbox.status, "other")) as SQL,
    );
  } else {
    // "all" tab (default) shows invoices/receipts only, excludes "other" documents
    whereConditions.push(
      and(
        or(sql`${inbox.type} IS NULL`, ne(inbox.type, "other")),
        ne(inbox.status, "other"),
      ) as SQL,
    );
  }

  // Apply search query filter
  if (q) {
    // If the query is a number, search by amount
    if (!Number.isNaN(Number.parseInt(q, 10))) {
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
      type: inbox.type,
      createdAt: inbox.createdAt,
      website: inbox.website,
      senderEmail: inbox.senderEmail,
      description: inbox.description,
      inboxAccountId: inbox.inboxAccountId,
      taxAmount: inbox.taxAmount,
      taxRate: inbox.taxRate,
      taxType: inbox.taxType,
      relatedCount: sql<number>`(
        SELECT COUNT(*)::int
        FROM ${inbox} AS related
        WHERE related.grouped_inbox_id = ${inbox.id}
      )`.as("relatedCount"),
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
  } else if (sort === "document_date") {
    // Sort by extracted document date (inbox.date)
    if (order === "desc") {
      // Newest first: NULL dates at the end
      query.orderBy(
        sql`${inbox.date} DESC NULLS LAST, ${inbox.createdAt} DESC`,
      );
    } else {
      // Oldest first: NULL dates at the beginning
      query.orderBy(sql`${inbox.date} ASC NULLS FIRST, ${inbox.createdAt} ASC`);
    }
  } else {
    // Default to createdAt sorting
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
      type: inbox.type,
      createdAt: inbox.createdAt,
      website: inbox.website,
      senderEmail: inbox.senderEmail,
      description: inbox.description,
      inboxAccountId: inbox.inboxAccountId,
      groupedInboxId: inbox.groupedInboxId,
      taxAmount: inbox.taxAmount,
      taxRate: inbox.taxRate,
      taxType: inbox.taxType,
      meta: inbox.meta,
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

  if (!result) {
    return null;
  }

  // Determine the primary item ID
  const primaryItemId = result.groupedInboxId || result.id;

  // If this item is grouped, fetch the primary item instead
  let primaryItem = result;
  if (result.groupedInboxId && result.groupedInboxId !== result.id) {
    const [primary] = await db
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
        type: inbox.type,
        createdAt: inbox.createdAt,
        website: inbox.website,
        senderEmail: inbox.senderEmail,
        description: inbox.description,
        inboxAccountId: inbox.inboxAccountId,
        groupedInboxId: inbox.groupedInboxId,
        taxAmount: inbox.taxAmount,
        taxRate: inbox.taxRate,
        taxType: inbox.taxType,
        meta: inbox.meta,
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
      .where(and(eq(inbox.id, primaryItemId), eq(inbox.teamId, teamId)))
      .limit(1);

    if (primary) {
      primaryItem = primary;
    }
  }

  // Fetch all related items (items that have this primary item as their groupedInboxId)
  const relatedItems = await db
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
      type: inbox.type,
      createdAt: inbox.createdAt,
      website: inbox.website,
      senderEmail: inbox.senderEmail,
      description: inbox.description,
      inboxAccountId: inbox.inboxAccountId,
    })
    .from(inbox)
    .where(
      and(
        eq(inbox.groupedInboxId, primaryItemId),
        eq(inbox.teamId, teamId),
        ne(inbox.status, "deleted"),
      ),
    );

  // If there's a suggestion, get the suggested transaction details
  if (primaryItem?.suggestion?.transactionId) {
    const [suggestedTransaction] = await db
      .select({
        id: transactions.id,
        name: transactions.name,
        amount: transactions.amount,
        currency: transactions.currency,
        date: transactions.date,
      })
      .from(transactions)
      .where(eq(transactions.id, primaryItem.suggestion.transactionId))
      .limit(1);

    return {
      ...primaryItem,
      suggestion: {
        ...primaryItem.suggestion,
        suggestedTransaction,
      },
      relatedItems: relatedItems.length > 0 ? relatedItems : undefined,
    };
  }

  return {
    ...primaryItem,
    relatedItems: relatedItems.length > 0 ? relatedItems : undefined,
  };
}

export type CheckInboxAttachmentsParams = {
  id: string;
  teamId: string;
};

export async function checkInboxAttachments(
  db: Database,
  params: CheckInboxAttachmentsParams,
) {
  const inboxItem = await db
    .select({
      id: inbox.id,
      filePath: inbox.filePath,
      fileName: inbox.fileName,
      transactionId: inbox.transactionId,
      attachmentId: inbox.attachmentId,
    })
    .from(inbox)
    .where(and(eq(inbox.id, params.id), eq(inbox.teamId, params.teamId)))
    .limit(1);

  if (!inboxItem[0]) {
    return { hasAttachments: false, attachments: [] };
  }

  // Check if inbox item has transaction attachment
  if (inboxItem[0].attachmentId && inboxItem[0].transactionId) {
    const attachments = await db
      .select({
        id: transactionAttachments.id,
        transactionId: transactionAttachments.transactionId,
        name: transactionAttachments.name,
      })
      .from(transactionAttachments)
      .where(
        and(
          eq(transactionAttachments.id, inboxItem[0].attachmentId),
          eq(transactionAttachments.teamId, params.teamId),
        ),
      );

    return {
      hasAttachments: attachments.length > 0,
      attachments,
      fileName: inboxItem[0].fileName,
    };
  }

  return {
    hasAttachments: false,
    attachments: [],
    fileName: inboxItem[0].fileName,
  };
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

  // Delete any match suggestions for this inbox item
  await db
    .delete(transactionMatchSuggestions)
    .where(
      and(
        eq(transactionMatchSuggestions.inboxId, id),
        eq(transactionMatchSuggestions.teamId, teamId),
      ),
    );

  // Get filePath before deletion for storage cleanup
  const [inboxItem] = await db
    .select({
      id: inbox.id,
      filePath: inbox.filePath,
    })
    .from(inbox)
    .where(and(eq(inbox.id, id), eq(inbox.teamId, teamId)))
    .limit(1);

  // Mark inbox item as deleted and clear attachment/transaction references
  const [deleted] = await db
    .update(inbox)
    .set({
      status: "deleted",
      transactionId: null,
      attachmentId: null,
    })
    .where(and(eq(inbox.id, id), eq(inbox.teamId, teamId)))
    .returning({
      id: inbox.id,
      filePath: inbox.filePath,
    });

  return {
    ...deleted,
    filePath: inboxItem?.filePath,
  };
}

export type DeleteInboxManyParams = {
  ids: string[];
  teamId: string;
};

export async function deleteInboxMany(
  db: Database,
  params: DeleteInboxManyParams,
) {
  const { ids, teamId } = params;

  if (ids.length === 0) {
    return [];
  }

  // Get all inbox items to check attachments and get filePaths
  const inboxItems = await db
    .select({
      id: inbox.id,
      transactionId: inbox.transactionId,
      attachmentId: inbox.attachmentId,
      filePath: inbox.filePath,
    })
    .from(inbox)
    .where(and(eq(inbox.teamId, teamId), inArray(inbox.id, ids)));

  const results: Array<{ id: string; filePath: string[] | null }> = [];

  // Process each inbox item
  for (const item of inboxItems) {
    try {
      // Clean up transaction attachment if it exists
      if (item.attachmentId && item.transactionId) {
        // Delete the specific transaction attachment for this inbox item
        await db
          .delete(transactionAttachments)
          .where(
            and(
              eq(transactionAttachments.id, item.attachmentId),
              eq(transactionAttachments.teamId, teamId),
            ),
          );

        // Check if this transaction still has other attachments before resetting tax info
        const remainingAttachments = await db
          .select({ count: sql<number>`count(*)` })
          .from(transactionAttachments)
          .where(
            and(
              eq(transactionAttachments.transactionId, item.transactionId),
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
            .where(eq(transactions.id, item.transactionId));
        }
      }

      // Delete any match suggestions for this inbox item
      await db
        .delete(transactionMatchSuggestions)
        .where(
          and(
            eq(transactionMatchSuggestions.inboxId, item.id),
            eq(transactionMatchSuggestions.teamId, teamId),
          ),
        );

      // Mark inbox item as deleted and clear attachment/transaction references
      const [deleted] = await db
        .update(inbox)
        .set({
          status: "deleted",
          transactionId: null,
          attachmentId: null,
        })
        .where(and(eq(inbox.id, item.id), eq(inbox.teamId, teamId)))
        .returning({
          id: inbox.id,
          filePath: inbox.filePath,
        });

      if (deleted) {
        results.push({
          id: deleted.id,
          filePath: deleted.filePath,
        });
      }
    } catch (error) {
      // Log error but continue with other items
      logger.error(`Failed to delete inbox item ${item.id}:`, {
        error:
          error instanceof Error
            ? { message: error.message, stack: error.stack }
            : { message: String(error) },
      });
    }
  }

  return results;
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
      // Exclude "other" documents (non-financial) from matching search
      // These documents skip embedding/matching in the worker processors
      ne(inbox.status, "other"),
      or(sql`${inbox.type} IS NULL`, ne(inbox.type, "other")) as SQL,
      // Exclude items that are already matched to other transactions
      sql`${inbox.transactionId} IS NULL`,
    ];

    // PRIORITY 1: User is searching with query
    if (q && q.trim().length > 0) {
      const searchTerm = q.trim();
      const searchQuery = buildSearchQuery(searchTerm);

      // Check if search term is a number (for amount searching)
      const numericSearch = Number.parseFloat(
        searchTerm.replace(/[^\d.-]/g, ""),
      );

      const isNumericSearch =
        !Number.isNaN(numericSearch) && Number.isFinite(numericSearch);

      if (isNumericSearch) {
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
        whereConditions.push(
          sql`(
            to_tsquery('english', ${searchQuery}) @@ ${inbox.fts}
            OR ${inbox.displayName} ILIKE '%' || ${searchTerm} || '%'
            OR ${inbox.fileName} ILIKE '%' || ${searchTerm} || '%'
            OR ${inbox.description} ILIKE '%' || ${searchTerm} || '%'
          )`,
        );
      }

      // Fetch transaction context for scoring when available
      let txContext: {
        name: string;
        amount: number | null;
        currency: string | null;
        baseAmount: number | null;
        baseCurrency: string | null;
        date: string;
        merchantName: string | null;
        counterpartyName: string | null;
      } | null = null;

      if (transactionId) {
        const [txData] = await db
          .select({
            name: transactions.name,
            amount: transactions.amount,
            currency: transactions.currency,
            baseAmount: transactions.baseAmount,
            baseCurrency: transactions.baseCurrency,
            date: transactions.date,
            merchantName: transactions.merchantName,
            counterpartyName: transactions.counterpartyName,
          })
          .from(transactions)
          .where(
            and(
              eq(transactions.id, transactionId),
              eq(transactions.teamId, teamId),
            ),
          )
          .limit(1);
        txContext = txData ?? null;
      }

      const fetchLimit = txContext ? Math.max(limit * 3, 30) : limit;

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
          status: inbox.status,
          website: inbox.website,
          baseAmount: inbox.baseAmount,
          baseCurrency: inbox.baseCurrency,
          taxAmount: inbox.taxAmount,
          taxRate: inbox.taxRate,
          taxType: inbox.taxType,
          type: inbox.type,
        })
        .from(inbox)
        .where(and(...whereConditions))
        .orderBy(desc(inbox.date), desc(inbox.createdAt))
        .limit(fetchLimit);

      if (!txContext) {
        return searchResults.slice(0, limit);
      }

      // Score and re-rank using transaction context
      return searchResults
        .map((candidate) => {
          const nameScore = calculateUnifiedNameScore(
            candidate.displayName,
            txContext.name,
            txContext.merchantName || txContext.counterpartyName,
          );
          const amountScore = calculateUnifiedAmountScore(candidate, txContext);
          const currencyScore = calculateUnifiedCurrencyScore(
            candidate.currency || undefined,
            txContext.currency || undefined,
            candidate.baseCurrency || undefined,
            txContext.baseCurrency || undefined,
          );
          const dateScore = candidate.date
            ? calculateUnifiedDateScore(
                candidate.date,
                txContext.date,
                candidate.type,
              )
            : 0;
          const isExactAmount =
            candidate.amount !== null &&
            Math.abs(
              Math.abs(candidate.amount || 0) - Math.abs(txContext.amount || 0),
            ) < 0.01;
          const isSameCurrency = candidate.currency === txContext.currency;
          const confidence = scoreMatch({
            nameScore,
            amountScore,
            dateScore,
            currencyScore,
            isSameCurrency,
            isExactAmount,
          });

          return {
            ...candidate,
            nameScore,
            amountScore,
            currencyScore,
            dateScore,
            confidenceScore: confidence,
          };
        })
        .sort((a, b) => b.confidenceScore - a.confidenceScore)
        .slice(0, limit);
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
          merchantName: transactions.merchantName,
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

        const unifiedTransactionAmount = Math.abs(transaction.amount || 0);
        const unifiedTransactionBaseAmount = Math.abs(
          transaction.baseAmount || 0,
        );
        const unifiedCandidates = await db.transaction(async (tx) => {
          await tx.execute(
            sql`SET LOCAL pg_trgm.word_similarity_threshold = 0.3`,
          );
          return tx
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
              status: inbox.status,
              type: inbox.type,
              website: inbox.website,
              taxAmount: inbox.taxAmount,
              taxRate: inbox.taxRate,
              taxType: inbox.taxType,
            })
            .from(inbox)
            .where(
              and(
                ...whereConditions,
                sql`${inbox.date} IS NOT NULL`,
                sql`${inbox.date} BETWEEN (${sql.param(transaction.date)}::date - INTERVAL '123 days') 
                    AND (${sql.param(transaction.date)}::date + INTERVAL '30 days')`,
                or(
                  and(
                    eq(inbox.currency, transaction.currency || ""),
                    sql`ABS(ABS(COALESCE(${inbox.amount}, 0)) - ${unifiedTransactionAmount}) < GREATEST(1, ${unifiedTransactionAmount} * 0.25)`,
                  ),
                  sql`(${transaction.merchantName || transaction.name} %> ${inbox.displayName})`,
                  and(
                    eq(inbox.baseCurrency, transaction.baseCurrency || ""),
                    sql`${inbox.baseCurrency} IS NOT NULL`,
                    sql`ABS(ABS(COALESCE(${inbox.baseAmount}, 0)) - ${unifiedTransactionBaseAmount}) < GREATEST(50, ${unifiedTransactionBaseAmount} * 0.15)`,
                  ),
                ),
              ),
            )
            .orderBy(
              sql`word_similarity(${transaction.merchantName || transaction.name}, COALESCE(${inbox.displayName}, '')) DESC`,
              sql`ABS(ABS(COALESCE(${inbox.amount}, 0)) - ${unifiedTransactionAmount}) / GREATEST(1.0, ${unifiedTransactionAmount})`,
              sql`ABS(${inbox.date} - ${sql.param(transaction.date)}::date)`,
            )
            .limit(Math.max(limit * 3, 30));
        });

        const unifiedScored = unifiedCandidates
          .map((candidate) => {
            const nameScore = calculateUnifiedNameScore(
              candidate.displayName,
              transaction.name,
              transaction.merchantName || transaction.counterpartyName,
            );
            const amountScore = calculateUnifiedAmountScore(
              candidate,
              transaction,
            );
            const currencyScore = calculateUnifiedCurrencyScore(
              candidate.currency || undefined,
              transaction.currency || undefined,
              candidate.baseCurrency || undefined,
              transaction.baseCurrency || undefined,
            );
            const dateScore = calculateUnifiedDateScore(
              candidate.date!,
              transaction.date,
              candidate.type,
            );
            const isExactAmount =
              candidate.amount !== null &&
              Math.abs(
                Math.abs(candidate.amount || 0) -
                  Math.abs(transaction.amount || 0),
              ) < 0.01;
            const isSameCurrency = candidate.currency === transaction.currency;
            const confidence = scoreMatch({
              nameScore,
              amountScore,
              dateScore,
              currencyScore,
              isSameCurrency,
              isExactAmount,
            });

            return {
              ...candidate,
              nameScore,
              amountScore,
              currencyScore,
              dateScore,
              confidenceScore: confidence,
            };
          })
          .filter((candidate) => candidate.confidenceScore >= 0.6)
          .sort((a, b) => b.confidenceScore - a.confidenceScore)
          .slice(0, limit);

        return unifiedScored;
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
        status: inbox.status,
        website: inbox.website,
        baseAmount: inbox.baseAmount,
        baseCurrency: inbox.baseCurrency,
        taxAmount: inbox.taxAmount,
        taxRate: inbox.taxRate,
        taxType: inbox.taxType,
      })
      .from(inbox)
      .where(and(...whereConditions))
      .orderBy(desc(inbox.createdAt))
      .limit(limit);

    return data;
  } catch (error) {
    logger.error("Error in getInboxSearch:", { error });
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
    | "suggested_match"
    | "other";
  contentType?: string;
};

export async function updateInbox(
  db: DatabaseOrTransaction,
  params: UpdateInboxParams,
) {
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

    // Delete any match suggestions for this inbox item
    await db
      .delete(transactionMatchSuggestions)
      .where(
        and(
          eq(transactionMatchSuggestions.inboxId, id),
          eq(transactionMatchSuggestions.teamId, teamId),
        ),
      );
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

export async function fetchInboxWithTransaction(
  db: DatabaseOrTransaction,
  inboxId: string,
  teamId: string,
) {
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
    .where(and(eq(inbox.id, inboxId), eq(inbox.teamId, teamId)))
    .limit(1);
  return data ?? null;
}

export async function matchTransaction(
  db: DatabaseOrTransaction,
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
      taxAmount: inbox.taxAmount,
      taxRate: inbox.taxRate,
      taxType: inbox.taxType,
      transactionId: inbox.transactionId, // Check if already matched
      status: inbox.status,
      groupedInboxId: inbox.groupedInboxId,
    })
    .from(inbox)
    .where(and(eq(inbox.id, id), eq(inbox.teamId, teamId)))
    .limit(1);

  if (!result) return null;

  // Check if inbox item is already matched to the same transaction (idempotent)
  if (result.transactionId) {
    if (result.transactionId === transactionId) {
      return fetchInboxWithTransaction(db, id, teamId);
    }
    throw new Error("Inbox item is already matched to a transaction");
  }

  // Determine the primary item ID (if this item is grouped, use the primary; otherwise use this item)
  const primaryItemId = result.groupedInboxId || result.id;

  // Find all related inbox items (items in the same group)
  const relatedItems = await db
    .select({
      id: inbox.id,
      contentType: inbox.contentType,
      filePath: inbox.filePath,
      size: inbox.size,
      fileName: inbox.fileName,
      taxAmount: inbox.taxAmount,
      taxRate: inbox.taxRate,
      taxType: inbox.taxType,
      transactionId: inbox.transactionId,
      status: inbox.status,
    })
    .from(inbox)
    .where(
      and(
        eq(inbox.teamId, teamId),
        or(
          eq(inbox.id, primaryItemId), // The primary item
          eq(inbox.groupedInboxId, primaryItemId), // Items grouped to the primary
        ),
      ),
    );

  // Check if any related item is matched to a *different* transaction
  const conflicting = relatedItems.find(
    (item) => item.transactionId && item.transactionId !== transactionId,
  );
  if (conflicting) {
    throw new Error("A related inbox item is already matched to a transaction");
  }

  // Filter out siblings already matched to the same transaction — only process unmatched items
  const unmatchedItems = relatedItems.filter((item) => !item.transactionId);

  if (unmatchedItems.length === 0) {
    return fetchInboxWithTransaction(db, id, teamId);
  }

  const [targetTransaction] = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(
      and(eq(transactions.id, transactionId), eq(transactions.teamId, teamId)),
    )
    .limit(1);

  if (!targetTransaction) {
    throw new Error("Transaction not found or belongs to another team");
  }

  // Insert transaction attachments for unmatched items only
  const attachmentIds = new Map<string, string>();

  for (const item of unmatchedItems) {
    const [attachmentData] = await db
      .insert(transactionAttachments)
      .values({
        type: item.contentType ?? "",
        path: item.filePath ?? [],
        transactionId,
        size: item.size ?? 0,
        name: item.fileName ?? "",
        teamId,
      })
      .returning({ id: transactionAttachments.id });

    if (attachmentData) {
      attachmentIds.set(item.id, attachmentData.id);
    }
  }

  // Update transaction with tax data from OCR (use primary item's tax data)
  // Transfer taxAmount if available (from OCR extraction)
  // Transfer taxRate and taxType if available
  const primaryItem =
    relatedItems.find((item) => item.id === primaryItemId) || result;
  const taxUpdates: {
    taxAmount?: number | null;
    taxRate?: number | null;
    taxType?: string | null;
  } = {};

  if (primaryItem.taxAmount !== null && primaryItem.taxAmount !== undefined) {
    taxUpdates.taxAmount = primaryItem.taxAmount;
  }

  if (
    primaryItem.taxRate !== null &&
    primaryItem.taxRate !== undefined &&
    primaryItem.taxType
  ) {
    taxUpdates.taxRate = primaryItem.taxRate;
    taxUpdates.taxType = primaryItem.taxType;
  }

  if (Object.keys(taxUpdates).length > 0) {
    await db
      .update(transactions)
      .set(taxUpdates)
      .where(
        and(
          eq(transactions.id, transactionId),
          eq(transactions.teamId, teamId),
        ),
      );
  }

  // Update unmatched inbox items with attachment and transaction IDs
  for (const item of unmatchedItems) {
    const attachmentId = attachmentIds.get(item.id);
    if (attachmentId) {
      await db
        .update(inbox)
        .set({
          attachmentId,
          transactionId: transactionId,
          status: "done",
        })
        .where(and(eq(inbox.id, item.id), eq(inbox.teamId, teamId)));
    }
  }

  return fetchInboxWithTransaction(db, id, teamId);
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
      groupedInboxId: inbox.groupedInboxId,
    })
    .from(inbox)
    .where(and(eq(inbox.id, id), eq(inbox.teamId, teamId)))
    .limit(1);

  if (!result) return null;

  // Determine the primary item ID (if this item is grouped, use the primary; otherwise use this item)
  const primaryItemId = result.groupedInboxId || result.id;

  // Find all related inbox items (items in the same group)
  const relatedItems = await db
    .select({
      id: inbox.id,
      transactionId: inbox.transactionId,
      attachmentId: inbox.attachmentId,
    })
    .from(inbox)
    .where(
      and(
        eq(inbox.teamId, teamId),
        or(
          eq(inbox.id, primaryItemId), // The primary item
          eq(inbox.groupedInboxId, primaryItemId), // Items grouped to the primary
        ),
      ),
    );

  // Get the transaction ID from the primary item (all related items should have the same transactionId)
  const transactionId = relatedItems.find(
    (item) => item.transactionId,
  )?.transactionId;

  // LEARNING FEEDBACK: Find the original match suggestions to mark as incorrect for all related items
  if (transactionId) {
    for (const item of relatedItems) {
      if (item.transactionId) {
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
              eq(transactionMatchSuggestions.inboxId, item.id),
              eq(transactionMatchSuggestions.transactionId, transactionId),
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
          logger.info("UNMATCH LEARNING FEEDBACK", {
            teamId,
            inboxId: item.id,
            transactionId,
            originalMatchType: originalSuggestion.matchType,
            originalConfidence: Number(originalSuggestion.confidenceScore),
            originalStatus: originalSuggestion.status,
            message:
              "User unmatched a previously confirmed/auto-matched pair - negative feedback for learning",
          });
        }
      }
    }
  }

  // Update all related inbox records
  await db
    .update(inbox)
    .set({
      transactionId: null,
      attachmentId: null,
      status: "pending",
    })
    .where(
      and(
        eq(inbox.teamId, teamId),
        or(
          eq(inbox.id, primaryItemId), // The primary item
          eq(inbox.groupedInboxId, primaryItemId), // Items grouped to the primary
        ),
      ),
    );

  // Delete all transaction attachments for related items
  const attachmentIds = relatedItems
    .map((item) => item.attachmentId)
    .filter((id): id is string => id !== null);

  if (attachmentIds.length > 0) {
    await db
      .delete(transactionAttachments)
      .where(
        and(
          inArray(transactionAttachments.id, attachmentIds),
          eq(transactionAttachments.teamId, teamId),
        ),
      );
  }

  // Check if this transaction still has other attachments before resetting tax info
  if (transactionId) {
    const remainingAttachments = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactionAttachments)
      .where(
        and(
          eq(transactionAttachments.transactionId, transactionId),
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
        .where(eq(transactions.id, transactionId));
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

  // First, try to find items in processing/new status (most recent first)
  const processingItem = await db
    .select({
      id: inbox.id,
      status: inbox.status,
      createdAt: inbox.createdAt,
      contentType: inbox.contentType,
      displayName: inbox.displayName,
    })
    .from(inbox)
    .where(
      and(
        eq(inbox.filePath, filePath),
        eq(inbox.teamId, teamId),
        ne(inbox.status, "deleted"),
        or(eq(inbox.status, "processing"), eq(inbox.status, "new")),
      ),
    )
    .orderBy(desc(inbox.createdAt))
    .limit(1);

  // If we found a processing/new item, return it (most recent)
  if (processingItem.length > 0 && processingItem[0]) {
    const item = processingItem[0];
    return {
      id: item.id,
      status: item.status,
      createdAt: item.createdAt,
      contentType: item.contentType,
      displayName: item.displayName,
    };
  }

  // Otherwise, return the most recent item regardless of status
  const [result] = await db
    .select({
      id: inbox.id,
      status: inbox.status,
      createdAt: inbox.createdAt,
      contentType: inbox.contentType,
      displayName: inbox.displayName,
    })
    .from(inbox)
    .where(
      and(
        eq(inbox.filePath, filePath),
        eq(inbox.teamId, teamId),
        ne(inbox.status, "deleted"),
      ),
    )
    .orderBy(desc(inbox.createdAt))
    .limit(1);

  if (!result) {
    return undefined;
  }

  return {
    id: result.id,
    status: result.status,
    createdAt: result.createdAt,
    contentType: result.contentType,
    displayName: result.displayName,
  };
}

export type GetStuckInboxItemsParams = {
  teamId: string;
  thresholdMinutes?: number;
};

/**
 * Find inbox items stuck in "processing" or "new" status for longer than threshold
 * Useful for cleanup jobs to recover stuck items
 */
export async function getStuckInboxItems(
  db: Database,
  params: GetStuckInboxItemsParams,
) {
  const { teamId, thresholdMinutes = 5 } = params;
  const thresholdMs = thresholdMinutes * 60 * 1000;
  const thresholdDate = new Date(Date.now() - thresholdMs).toISOString();

  const stuckItems = await db
    .select({
      id: inbox.id,
      status: inbox.status,
      createdAt: inbox.createdAt,
      filePath: inbox.filePath,
      displayName: inbox.displayName,
    })
    .from(inbox)
    .where(
      and(
        eq(inbox.teamId, teamId),
        ne(inbox.status, "deleted"),
        or(eq(inbox.status, "processing"), eq(inbox.status, "new")),
        lt(inbox.createdAt, thresholdDate),
      ),
    )
    .orderBy(desc(inbox.createdAt));

  return stuckItems;
}

export type GetExistingInboxAttachmentsByReferenceIdsParams = {
  referenceIds: string[];
  teamId: string;
};

export async function getExistingInboxAttachmentsByReferenceIds(
  db: Database,
  params: GetExistingInboxAttachmentsByReferenceIdsParams,
) {
  const { referenceIds, teamId } = params;

  if (referenceIds.length === 0) {
    return [];
  }

  // Filter out any null/undefined referenceIds to avoid SQL issues
  const validReferenceIds = referenceIds.filter(
    (id): id is string => id != null && id !== "",
  );

  if (validReferenceIds.length === 0) {
    return [];
  }

  logger.info("Querying for existing inbox attachments by referenceIds", {
    teamId,
    referenceIdsCount: validReferenceIds.length,
    sampleIds: validReferenceIds.slice(0, 3),
  });

  const results = await db
    .select({
      referenceId: inbox.referenceId,
      status: inbox.status,
    })
    .from(inbox)
    .where(
      and(
        inArray(inbox.referenceId, validReferenceIds),
        eq(inbox.teamId, teamId),
        ne(inbox.status, "deleted"),
      ),
    );

  logger.info("Found existing inbox attachments", {
    teamId,
    foundCount: results.length,
    foundIds: results.map((r) => r.referenceId).slice(0, 3),
  });

  return results;
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
  senderEmail?: string;
  inboxAccountId?: string;
  meta?: Record<string, unknown>;
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
    senderEmail,
    inboxAccountId,
    meta,
    status = "new",
  } = params;

  // If we have a referenceId, use ON CONFLICT to handle race conditions
  // where multiple jobs try to create the same inbox item simultaneously
  if (referenceId) {
    logger.info("Creating inbox item with referenceId (using ON CONFLICT)", {
      referenceId,
      teamId,
      filePath,
    });

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
        senderEmail,
        inboxAccountId,
        meta,
        status,
      })
      .onConflictDoNothing({
        target: inbox.referenceId,
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
        senderEmail: inbox.senderEmail,
        description: inbox.description,
        referenceId: inbox.referenceId,
        size: inbox.size,
        inboxAccountId: inbox.inboxAccountId,
      });

    // If insert was skipped due to conflict, fetch the existing row
    if (!result) {
      logger.info(
        "Insert skipped due to referenceId conflict, fetching existing row",
        {
          referenceId,
          teamId,
        },
      );

      const [existingRow] = await db
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
          senderEmail: inbox.senderEmail,
          description: inbox.description,
          referenceId: inbox.referenceId,
          size: inbox.size,
          inboxAccountId: inbox.inboxAccountId,
        })
        .from(inbox)
        .where(
          and(eq(inbox.referenceId, referenceId), eq(inbox.teamId, teamId)),
        )
        .limit(1);

      logger.info("Fetched existing inbox item", {
        referenceId,
        teamId,
        existingId: existingRow?.id,
        existingStatus: existingRow?.status,
      });

      return existingRow;
    }

    logger.info("Successfully created new inbox item", {
      referenceId,
      teamId,
      newId: result.id,
    });

    return result;
  }

  // No referenceId - regular insert (for manual uploads)
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
      senderEmail,
      inboxAccountId,
      meta,
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
      senderEmail: inbox.senderEmail,
      description: inbox.description,
      referenceId: inbox.referenceId,
      size: inbox.size,
      inboxAccountId: inbox.inboxAccountId,
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
  type?: "invoice" | "expense" | "other" | null;
  invoiceNumber?: string;
  status?:
    | "pending"
    | "new"
    | "archived"
    | "processing"
    | "done"
    | "deleted"
    | "analyzing"
    | "other";
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
      invoiceNumber: inbox.invoiceNumber,
    });

  return result;
}

export type GetInboxStatsParams = {
  teamId: string;
  from: string;
  to: string;
  currency?: string;
};

export async function getInboxStats(db: Database, params: GetInboxStatsParams) {
  const { teamId, from, to, currency } = params;

  const [statusCounts, recentMatches, pendingSuggestions] = await Promise.all([
    db
      .select({
        status: inbox.status,
        count: sql<number>`count(*)`,
      })
      .from(inbox)
      .where(and(eq(inbox.teamId, teamId), ne(inbox.status, "deleted")))
      .groupBy(inbox.status),

    db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(inbox)
      .where(
        and(
          eq(inbox.teamId, teamId),
          eq(inbox.status, "done"),
          sql`${inbox.createdAt}::date >= ${from}::date`,
          sql`${inbox.createdAt}::date <= ${to}::date`,
        ),
      ),

    db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(transactionMatchSuggestions)
      .innerJoin(inbox, eq(transactionMatchSuggestions.inboxId, inbox.id))
      .where(
        and(
          eq(inbox.teamId, teamId),
          eq(transactionMatchSuggestions.status, "pending"),
        ),
      ),
  ]);

  // Process results
  const stats = {
    newItems: 0,
    pendingItems: 0,
    analyzingItems: 0,
    suggestedMatches: 0,
    recentMatches: Number(recentMatches[0]?.count || 0),
    totalItems: 0,
  };

  for (const statusCount of statusCounts) {
    const count = Number(statusCount.count);
    stats.totalItems += count;

    switch (statusCount.status) {
      case "new":
        stats.newItems = count;
        break;
      case "pending":
        stats.pendingItems = count;
        break;
      case "analyzing":
        stats.analyzingItems = count;
        break;
      case "suggested_match":
        stats.suggestedMatches = count;
        break;
    }
  }

  // Add pending suggestions to suggested matches count
  stats.suggestedMatches += Number(pendingSuggestions[0]?.count || 0);

  return {
    result: stats,
    meta: {
      from,
      to,
      currency,
      teamId,
    },
  };
}

export type FindRelatedInboxItemsParams = {
  inboxId: string;
  teamId: string;
};

export async function findRelatedInboxItems(
  db: Database,
  params: FindRelatedInboxItemsParams,
) {
  const { inboxId, teamId } = params;

  // Get the current inbox item
  const [currentItem] = await db
    .select({
      id: inbox.id,
      invoiceNumber: inbox.invoiceNumber,
      website: inbox.website,
      amount: inbox.amount,
      date: inbox.date,
      type: inbox.type,
      createdAt: inbox.createdAt,
    })
    .from(inbox)
    .where(and(eq(inbox.id, inboxId), eq(inbox.teamId, teamId)))
    .limit(1);

  if (!currentItem) {
    return [];
  }

  const conditions: SQL[] = [
    eq(inbox.teamId, teamId),
    ne(inbox.id, inboxId),
    ne(inbox.status, "deleted"),
    sql`${inbox.groupedInboxId} IS NULL`, // Only find items that aren't already grouped
  ];

  // Primary matching: invoice number
  if (currentItem.invoiceNumber) {
    const relatedByInvoiceNumber = await db
      .select({
        id: inbox.id,
        invoiceNumber: inbox.invoiceNumber,
        website: inbox.website,
        amount: inbox.amount,
        date: inbox.date,
        type: inbox.type,
        createdAt: inbox.createdAt,
      })
      .from(inbox)
      .where(
        and(...conditions, eq(inbox.invoiceNumber, currentItem.invoiceNumber)),
      );

    if (relatedByInvoiceNumber.length > 0) {
      return relatedByInvoiceNumber;
    }
  }

  // Fallback matching: same website + same amount + same date + different type
  // Only match when current item has a known type (invoice or expense)
  if (
    currentItem.website &&
    currentItem.amount &&
    currentItem.date &&
    (currentItem.type === "invoice" || currentItem.type === "expense")
  ) {
    const relatedByFallback = await db
      .select({
        id: inbox.id,
        invoiceNumber: inbox.invoiceNumber,
        website: inbox.website,
        amount: inbox.amount,
        date: inbox.date,
        type: inbox.type,
        createdAt: inbox.createdAt,
      })
      .from(inbox)
      .where(
        and(
          ...conditions,
          eq(inbox.website, currentItem.website),
          eq(inbox.amount, currentItem.amount),
          eq(inbox.date, currentItem.date),
          // Different type (invoice vs expense)
          currentItem.type === "invoice"
            ? eq(inbox.type, "expense")
            : eq(inbox.type, "invoice"),
        ),
      );

    return relatedByFallback;
  }

  return [];
}

export type GroupRelatedInboxItemsParams = {
  inboxId: string;
  teamId: string;
};

export async function groupRelatedInboxItems(
  db: Database,
  params: GroupRelatedInboxItemsParams,
) {
  const { inboxId, teamId } = params;

  // Find related items
  const relatedItems = await findRelatedInboxItems(db, { inboxId, teamId });

  if (relatedItems.length === 0) {
    return;
  }

  // Get the current item
  const [currentItem] = await db
    .select({
      id: inbox.id,
      invoiceNumber: inbox.invoiceNumber,
      type: inbox.type,
      createdAt: inbox.createdAt,
    })
    .from(inbox)
    .where(and(eq(inbox.id, inboxId), eq(inbox.teamId, teamId)))
    .limit(1);

  if (!currentItem) {
    return;
  }

  // Collect all items to group (current + related)
  const allItems = [
    {
      id: currentItem.id,
      type: currentItem.type,
      createdAt: currentItem.createdAt,
    },
    ...relatedItems.map((item) => ({
      id: item.id,
      type: item.type,
      createdAt: item.createdAt,
    })),
  ];

  // Determine primary item: prefer invoice type, then oldest
  const primaryItem = allItems.reduce((primary, item) => {
    if (item.type === "invoice" && primary.type !== "invoice") {
      return item;
    }
    if (item.type === primary.type) {
      return new Date(item.createdAt) < new Date(primary.createdAt)
        ? item
        : primary;
    }
    return primary;
  });

  // Update all items to point to the primary item
  const itemsToUpdate = allItems
    .filter((item) => item.id !== primaryItem.id)
    .map((item) => item.id);

  if (itemsToUpdate.length > 0) {
    await db
      .update(inbox)
      .set({ groupedInboxId: primaryItem.id })
      .where(and(inArray(inbox.id, itemsToUpdate), eq(inbox.teamId, teamId)));

    logger.info("Grouped related inbox items", {
      primaryItemId: primaryItem.id,
      groupedItemIds: itemsToUpdate,
      teamId,
    });
  }
}

export type UpdateInboxStatusParams = {
  id: string;
  status:
    | "pending"
    | "analyzing"
    | "no_match"
    | "new"
    | "archived"
    | "processing"
    | "done"
    | "suggested_match";
};

/**
 * Simple function to update inbox status by ID
 * Used by worker processors for status updates
 */
export async function updateInboxStatus(
  db: Database,
  params: UpdateInboxStatusParams,
) {
  await db
    .update(inbox)
    .set({ status: params.status })
    .where(eq(inbox.id, params.id));
}

export type UpdateInboxStatusToNoMatchParams = {
  cutoffDate: string;
};

export type UpdateInboxStatusToNoMatchResult = {
  updatedCount: number;
  updatedItems: Array<{
    id: string;
    teamId: string | null;
    displayName: string | null;
    createdAt: string;
  }>;
};

/**
 * Bulk update function for no-match scheduler
 * Updates inbox items to "no_match" status after they have been pending for 90 days
 */
export async function updateInboxStatusToNoMatch(
  db: Database,
  params: UpdateInboxStatusToNoMatchParams,
): Promise<UpdateInboxStatusToNoMatchResult> {
  const result = await db
    .update(inbox)
    .set({
      status: "no_match",
    })
    .where(
      and(
        eq(inbox.status, "pending"),
        lt(inbox.createdAt, params.cutoffDate),
        // Make sure they're not already matched
        sql`${inbox.transactionId} IS NULL`,
      ),
    )
    .returning({
      id: inbox.id,
      teamId: inbox.teamId,
      displayName: inbox.displayName,
      createdAt: inbox.createdAt,
    });

  return {
    updatedCount: result.length,
    updatedItems: result.map((item) => ({
      id: item.id,
      teamId: item.teamId,
      displayName: item.displayName,
      createdAt: item.createdAt,
    })),
  };
}
