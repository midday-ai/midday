import {
  CONTRA_REVENUE_CATEGORIES,
  REVENUE_CATEGORIES,
} from "@midday/categories";
import { buildSearchQuery } from "@midday/db/utils/search-query";
import { createLoggerWithContext } from "@midday/logger";
import { resolveTaxValues } from "@midday/utils/tax";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  lt,
  lte,
  ne,
  not,
  or,
  sql,
} from "drizzle-orm";
import type { SQL } from "drizzle-orm/sql/sql";
import { nanoid } from "nanoid";
import type { Database } from "../client";
import {
  accountingSyncRecords,
  bankAccounts,
  bankConnections,
  inbox,
  tags,
  transactionAttachments,
  transactionCategories,
  type transactionFrequencyEnum,
  transactionMatchSuggestions,
  transactions,
  transactionTags,
  users,
} from "../schema";
import {
  calculateAmountScore,
  calculateCurrencyScore,
  calculateDateScore,
  calculateNameScore,
  scoreMatch,
} from "../utils/transaction-matching";
import { createActivity } from "./activities";
import { type Attachment, createAttachments } from "./transaction-attachments";

const logger = createLoggerWithContext("transactions");

export type GetTransactionsParams = {
  teamId: string;
  cursor?: string | null;
  sort?: string[] | null;
  pageSize?: number;
  q?: string | null;
  statuses?:
    | (
        | "blank"
        | "receipt_match"
        | "in_review"
        | "export_error"
        | "exported"
        | "excluded"
        | "archived"
      )[]
    | null;
  attachments?: "include" | "exclude" | null;
  categories?: string[] | null;
  tags?: string[] | null;
  accounts?: string[] | null;
  assignees?: string[] | null;
  type?: "income" | "expense" | null;
  start?: string | null;
  end?: string | null;
  recurring?: string[] | null;
  amountRange?: number[] | null;
  amount?: string[] | null;
  manual?: "include" | "exclude" | null;
  /** Filter by export status: true = only exported, false = only NOT exported, undefined = no filter */
  exported?: boolean | null;
  /** Filter by fulfillment: true = ready for review (has attachments OR status=completed), false = not ready */
  fulfilled?: boolean | null;
};

// Helper type from schema if not already exported
type TransactionFrequency =
  (typeof transactionFrequencyEnum.enumValues)[number];

export async function getTransactions(
  db: Database,
  params: GetTransactionsParams,
) {
  // Always limit by teamId
  const {
    teamId,
    sort,
    cursor,
    pageSize = 40,
    q,
    statuses,
    attachments,
    categories: filterCategories,
    tags: filterTags,
    type,
    accounts: filterAccounts,
    start,
    end,
    assignees: filterAssignees,
    recurring: filterRecurring,
    amount: filterAmount,
    amountRange: filterAmountRange,
    manual: filterManual,
    exported,
    fulfilled,
  } = params;

  // Always start with teamId filter
  const whereConditions: (SQL | undefined)[] = [
    eq(transactions.teamId, teamId),
  ];

  // Date range filter
  if (start) {
    whereConditions.push(gte(transactions.date, start));
  }
  if (end) {
    whereConditions.push(lte(transactions.date, end));
  }

  // Search query filter (name, description, or amount)
  if (q) {
    const numericQ = Number(q);
    if (!Number.isNaN(numericQ) && q.trim() !== "") {
      whereConditions.push(sql`${transactions.amount} = ${numericQ}`);
    } else {
      const searchQuery = buildSearchQuery(q);
      const ftsCondition = sql`to_tsquery('english', ${searchQuery}) @@ ${transactions.ftsVector}`;
      const nameCondition = sql`${transactions.name} ILIKE '%' || ${q} || '%'`;
      const descriptionCondition = sql`${transactions.description} ILIKE '%' || ${q} || '%'`;
      whereConditions.push(
        or(ftsCondition, nameCondition, descriptionCondition),
      );
    }
  }

  const isFulfilledCondition = sql`(
    EXISTS (
      SELECT 1
      FROM ${transactionAttachments}
      WHERE ${eq(transactionAttachments.transactionId, transactions.id)}
      AND ${eq(transactionAttachments.teamId, teamId)}
    ) OR ${transactions.status} = 'completed'
  )`;

  const isExportedCondition = sql`(
    ${transactions.status} = 'exported' OR EXISTS (
      SELECT 1
      FROM ${accountingSyncRecords}
      WHERE ${accountingSyncRecords.transactionId} = ${transactions.id}
      AND ${accountingSyncRecords.teamId} = ${teamId}
      AND ${accountingSyncRecords.status} = 'synced'
    )
  )`;

  const hasExportErrorCondition = sql`EXISTS (
    SELECT 1
    FROM ${accountingSyncRecords}
    WHERE ${accountingSyncRecords.transactionId} = ${transactions.id}
    AND ${accountingSyncRecords.teamId} = ${teamId}
    AND ${accountingSyncRecords.status} IN ('failed', 'partial')
  )`;

  const hasPendingSuggestionCondition = sql`EXISTS (
    SELECT 1
    FROM ${transactionMatchSuggestions}
    WHERE ${transactionMatchSuggestions.transactionId} = ${transactions.id}
    AND ${transactionMatchSuggestions.teamId} = ${teamId}
    AND ${transactionMatchSuggestions.status} = 'pending'
  )`;

  const isActiveWorkflowCondition = sql`${transactions.status} NOT IN ('excluded', 'archived')`;

  if (attachments === "exclude") {
    whereConditions.push(sql`NOT (${isFulfilledCondition})`);
  } else if (attachments === "include") {
    whereConditions.push(isFulfilledCondition);
  }

  // UI status filters map to computed states. DB status remains unchanged.
  if (statuses && statuses.length > 0) {
    const statusConditions: SQL[] = [];

    if (statuses.includes("blank")) {
      statusConditions.push(
        sql`(
          ${isActiveWorkflowCondition}
          AND NOT (${isFulfilledCondition})
          AND NOT (${isExportedCondition})
          AND NOT (${hasExportErrorCondition})
        )`,
      );
    }

    if (statuses.includes("receipt_match")) {
      statusConditions.push(
        sql`(
          ${isActiveWorkflowCondition}
          AND ${hasPendingSuggestionCondition}
          AND NOT (${isFulfilledCondition})
          AND NOT (${isExportedCondition})
        )`,
      );
    }

    if (statuses.includes("in_review")) {
      statusConditions.push(
        sql`(
          ${isActiveWorkflowCondition}
          AND ${isFulfilledCondition}
          AND NOT (${isExportedCondition})
          AND NOT (${hasExportErrorCondition})
        )`,
      );
    }

    if (statuses.includes("export_error")) {
      statusConditions.push(
        sql`(
          ${isActiveWorkflowCondition}
          AND ${hasExportErrorCondition}
          AND NOT (${isExportedCondition})
        )`,
      );
    }

    if (statuses.includes("exported")) {
      statusConditions.push(isExportedCondition);
    }

    if (statuses.includes("excluded")) {
      statusConditions.push(eq(transactions.status, "excluded"));
    }

    if (statuses.includes("archived")) {
      statusConditions.push(eq(transactions.status, "archived"));
    }

    if (statusConditions.length > 0) {
      whereConditions.push(or(...statusConditions));
    } else {
      // All values were unrecognized — fall back to default exclusion so
      // archived/excluded transactions don't leak into results.
      whereConditions.push(isActiveWorkflowCondition);
    }
  } else {
    // Default All tab behavior: hide excluded/archived unless explicitly filtered.
    whereConditions.push(isActiveWorkflowCondition);
  }

  // Categories filter with child category expansion
  if (filterCategories && filterCategories.length > 0) {
    const categorySlugs = filterCategories.filter(
      (slug) => slug !== "uncategorized",
    );

    const expandedSlugs = new Set<string>(categorySlugs);

    // Only query if we have category slugs (not just "uncategorized")
    if (categorySlugs.length > 0) {
      // Query categories to identify parents and get their IDs
      const categories = await db
        .select({
          slug: transactionCategories.slug,
          id: transactionCategories.id,
          parentId: transactionCategories.parentId,
        })
        .from(transactionCategories)
        .where(
          and(
            eq(transactionCategories.teamId, teamId),
            inArray(transactionCategories.slug, categorySlugs),
          ),
        );

      // Find parent category IDs (categories with no parentId)
      const parentCategoryIds = categories
        .filter((cat) => !cat.parentId)
        .map((cat) => cat.id);

      // Get all child category slugs for parent categories
      if (parentCategoryIds.length > 0) {
        const childCategories = await db
          .select({ slug: transactionCategories.slug })
          .from(transactionCategories)
          .where(
            and(
              eq(transactionCategories.teamId, teamId),
              inArray(transactionCategories.parentId, parentCategoryIds),
            ),
          );

        // Add child slugs to the set (automatic deduplication)
        for (const child of childCategories) {
          if (child.slug) {
            expandedSlugs.add(child.slug);
          }
        }
      }
    }

    // Build filter conditions
    const categoryConditions: (SQL | undefined)[] = [];

    // Handle uncategorized separately
    if (filterCategories.includes("uncategorized")) {
      categoryConditions.push(isNull(transactions.categorySlug));
    }

    // Handle category slugs (now includes children, deduplicated)
    if (expandedSlugs.size > 0) {
      categoryConditions.push(
        inArray(transactions.categorySlug, Array.from(expandedSlugs)),
      );
    }

    const definedCategoryConditions = categoryConditions.filter(
      (c) => c !== undefined,
    ) as SQL[];
    if (definedCategoryConditions.length > 0) {
      whereConditions.push(or(...definedCategoryConditions));
    }
  }

  // Tags filter using EXISTS
  if (filterTags && filterTags.length > 0) {
    const tagsExistSubquery = db
      .select({ val: sql`1` })
      .from(transactionTags)
      .innerJoin(tags, eq(transactionTags.tagId, tags.id))
      .where(
        and(
          eq(transactionTags.transactionId, transactions.id), // Correlate with the outer transaction
          eq(transactionTags.teamId, teamId), // Ensure transactionTags are for the correct team
          inArray(tags.id, filterTags), // Filter by the provided tag IDs
        ),
      );
    whereConditions.push(sql`EXISTS (${tagsExistSubquery})`);
  }

  // Recurring filter
  if (filterRecurring && filterRecurring.length > 0) {
    if (filterRecurring.includes("all")) {
      whereConditions.push(eq(transactions.recurring, true));
    } else {
      const validFrequencies = filterRecurring.filter(
        (f) => f !== "all",
      ) as TransactionFrequency[];
      if (validFrequencies.length > 0) {
        whereConditions.push(inArray(transactions.frequency, validFrequencies));
      }
    }
  }

  // Type filter (expense/income)
  if (type === "expense") {
    whereConditions.push(lt(transactions.amount, 0));
    whereConditions.push(ne(transactions.categorySlug, "transfer"));
  } else if (type === "income") {
    whereConditions.push(
      inArray(transactions.categorySlug, REVENUE_CATEGORIES),
    );
    whereConditions.push(
      not(inArray(transactions.categorySlug, CONTRA_REVENUE_CATEGORIES)),
    );
  }

  // Accounts filter
  if (filterAccounts && filterAccounts.length > 0) {
    whereConditions.push(
      and(
        inArray(transactions.bankAccountId, filterAccounts),
        sql`EXISTS (SELECT 1 FROM ${bankAccounts} WHERE ${eq(bankAccounts.id, transactions.bankAccountId)} AND ${eq(bankAccounts.teamId, teamId)})`,
      ),
    );
  }

  // Assignees filter
  if (filterAssignees && filterAssignees.length > 0) {
    whereConditions.push(
      and(
        inArray(transactions.assignedId, filterAssignees),
        sql`EXISTS (SELECT 1 FROM ${users} WHERE ${eq(users.id, transactions.assignedId)} AND ${eq(users.teamId, teamId)})`,
      ),
    );
  }

  // Amount range filter - behavior depends on type filter:
  // - type="expense": filter on negative amounts (-max to -min)
  // - type="income": filter on positive amounts (min to max)
  // - type=null: use ABS() to include both directions
  if (
    filterAmountRange &&
    filterAmountRange.length === 2 &&
    filterAmountRange[0] != null &&
    filterAmountRange[1] != null
  ) {
    let minAmount = Number(filterAmountRange[0]);
    let maxAmount = Number(filterAmountRange[1]);
    if (!Number.isNaN(minAmount) && !Number.isNaN(maxAmount)) {
      // Ensure min <= max
      if (minAmount > maxAmount) {
        [minAmount, maxAmount] = [maxAmount, minAmount];
      }

      if (type === "expense") {
        // For expenses (negative amounts), filter between -maxAmount and -minAmount
        // e.g., range [50, 100] filters amounts between -100 and -50
        whereConditions.push(
          sql`COALESCE(${transactions.baseAmount}, ${transactions.amount}) >= ${-maxAmount}`,
        );
        whereConditions.push(
          sql`COALESCE(${transactions.baseAmount}, ${transactions.amount}) <= ${-minAmount}`,
        );
      } else if (type === "income") {
        // For income (positive amounts), filter between minAmount and maxAmount
        whereConditions.push(
          sql`COALESCE(${transactions.baseAmount}, ${transactions.amount}) >= ${minAmount}`,
        );
        whereConditions.push(
          sql`COALESCE(${transactions.baseAmount}, ${transactions.amount}) <= ${maxAmount}`,
        );
      } else {
        // For "Any" type, use ABS() to include both positive and negative amounts
        whereConditions.push(
          sql`ABS(COALESCE(${transactions.baseAmount}, ${transactions.amount})) >= ${minAmount}`,
        );
        whereConditions.push(
          sql`ABS(COALESCE(${transactions.baseAmount}, ${transactions.amount})) <= ${maxAmount}`,
        );
      }
    }
  }

  // Specific amount filter (gte/lte)
  if (filterAmount && filterAmount.length === 2) {
    const [operator, value] = filterAmount;
    if (operator === "gte") {
      whereConditions.push(gte(transactions.amount, Number(value)));
    } else if (operator === "lte") {
      whereConditions.push(lte(transactions.amount, Number(value)));
    }
  }

  // Manual filter
  if (filterManual === "include") {
    whereConditions.push(eq(transactions.manual, true));
  } else if (filterManual === "exclude") {
    whereConditions.push(eq(transactions.manual, false));
  }

  // Exported filter: true = only exported, false = only NOT exported
  // A transaction is considered exported if status = 'exported' OR has a synced accounting record
  if (exported === true) {
    // Only exported transactions
    whereConditions.push(
      sql`(
        ${transactions.status} = 'exported' OR EXISTS (
          SELECT 1 FROM ${accountingSyncRecords}
          WHERE ${accountingSyncRecords.transactionId} = ${transactions.id}
          AND ${accountingSyncRecords.teamId} = ${teamId}
          AND ${accountingSyncRecords.status} = 'synced'
        )
      )`,
    );
  } else if (exported === false) {
    // Only NOT exported transactions (not synced to accounting)
    // Also exclude 'excluded' and 'archived' to match getTransactionsReadyForExportCount
    // Include 'exported' in exclusion list to maintain mutual exclusivity with exported === true
    whereConditions.push(
      sql`(
        ${transactions.status} NOT IN ('exported', 'excluded', 'archived') AND NOT EXISTS (
          SELECT 1 FROM ${accountingSyncRecords}
          WHERE ${accountingSyncRecords.transactionId} = ${transactions.id}
          AND ${accountingSyncRecords.teamId} = ${teamId}
          AND ${accountingSyncRecords.status} = 'synced'
        )
      )`,
    );
  }

  // Fulfilled filter: true = has attachments OR status=completed, false = no attachments AND status!=completed
  if (fulfilled === true) {
    whereConditions.push(
      sql`(EXISTS (SELECT 1 FROM ${transactionAttachments} WHERE ${eq(transactionAttachments.transactionId, transactions.id)} AND ${eq(transactionAttachments.teamId, teamId)}) OR ${transactions.status} = 'completed')`,
    );
  } else if (fulfilled === false) {
    whereConditions.push(
      sql`NOT (EXISTS (SELECT 1 FROM ${transactionAttachments} WHERE ${eq(transactionAttachments.transactionId, transactions.id)} AND ${eq(transactionAttachments.teamId, teamId)}) OR ${transactions.status} = 'completed')`,
    );
  }

  const finalWhereConditions = whereConditions.filter(
    (c) => c !== undefined,
  ) as SQL[];

  // All joins must also be limited by teamId where relevant
  const queryBuilder = db
    .select({
      id: transactions.id,
      date: transactions.date,
      amount: transactions.amount,
      currency: transactions.currency,
      method: transactions.method,
      status: transactions.status,
      note: transactions.note,
      manual: transactions.manual,
      internal: transactions.internal,
      recurring: transactions.recurring,
      counterpartyName: transactions.counterpartyName,
      frequency: transactions.frequency,
      name: transactions.name,
      description: transactions.description,
      createdAt: transactions.createdAt,
      taxRate: transactions.taxRate,
      taxType: transactions.taxType,
      taxAmount: transactions.taxAmount,
      baseAmount: transactions.baseAmount,
      baseCurrency: transactions.baseCurrency,
      enrichmentCompleted: transactions.enrichmentCompleted,
      isFulfilled:
        sql<boolean>`(EXISTS (SELECT 1 FROM ${transactionAttachments} WHERE ${eq(transactionAttachments.transactionId, transactions.id)} AND ${eq(transactionAttachments.teamId, teamId)}) OR ${transactions.status} = 'completed')`.as(
          "isFulfilled",
        ),
      hasPendingSuggestion: sql<boolean>`EXISTS (
          SELECT 1 FROM ${transactionMatchSuggestions} tms 
          WHERE tms.transaction_id = ${transactions.id} 
          AND tms.team_id = ${teamId} 
          AND tms.status = 'pending'
        )`.as("hasPendingSuggestion"),
      isExported: sql<boolean>`(
          ${transactions.status} = 'exported' OR EXISTS (
            SELECT 1 FROM ${accountingSyncRecords}
            WHERE ${accountingSyncRecords.transactionId} = ${transactions.id}
            AND ${accountingSyncRecords.teamId} = ${teamId}
            AND ${accountingSyncRecords.status} = 'synced'
          )
        )`.as("isExported"),
      exportProvider: sql<string | null>`(
          SELECT ${accountingSyncRecords.provider}
          FROM ${accountingSyncRecords}
          WHERE ${accountingSyncRecords.transactionId} = ${transactions.id}
          AND ${accountingSyncRecords.teamId} = ${teamId}
          AND ${accountingSyncRecords.status} = 'synced'
          LIMIT 1
        )`.as("exportProvider"),
      exportedAt: sql<string | null>`(
          SELECT ${accountingSyncRecords.syncedAt}
          FROM ${accountingSyncRecords}
          WHERE ${accountingSyncRecords.transactionId} = ${transactions.id}
          AND ${accountingSyncRecords.teamId} = ${teamId}
          AND ${accountingSyncRecords.status} = 'synced'
          LIMIT 1
        )`.as("exportedAt"),
      hasExportError: sql<boolean>`EXISTS (
          SELECT 1 FROM ${accountingSyncRecords}
          WHERE ${accountingSyncRecords.transactionId} = ${transactions.id}
          AND ${accountingSyncRecords.teamId} = ${teamId}
          AND ${accountingSyncRecords.status} IN ('failed', 'partial')
        )`.as("hasExportError"),
      exportErrorCode: sql<string | null>`(
          SELECT ${accountingSyncRecords.errorCode}
          FROM ${accountingSyncRecords}
          WHERE ${accountingSyncRecords.transactionId} = ${transactions.id}
          AND ${accountingSyncRecords.teamId} = ${teamId}
          AND ${accountingSyncRecords.status} IN ('failed', 'partial')
          LIMIT 1
        )`.as("exportErrorCode"),
      attachments: sql<
        Array<{
          id: string;
          filename: string | null;
          path: string | null;
          type: string;
          size: number;
        }>
      >`COALESCE((
        SELECT json_agg(jsonb_build_object('id', ta.id, 'filename', ta.name, 'path', ta.path, 'type', ta.type, 'size', ta.size))
        FROM ${transactionAttachments} ta
        WHERE ta.transaction_id = ${transactions.id} AND ta.team_id = ${teamId}
      ), '[]'::json)`.as("attachments"),
      assigned: {
        id: users.id,
        fullName: users.fullName,
        avatarUrl: users.avatarUrl,
      },
      category: {
        id: transactionCategories.id,
        name: transactionCategories.name,
        color: transactionCategories.color,
        slug: transactionCategories.slug,
        taxRate: transactionCategories.taxRate,
        taxType: transactionCategories.taxType,
      },
      account: {
        id: bankAccounts.id,
        name: bankAccounts.name,
        currency: bankAccounts.currency,
      },
      connection: {
        id: bankConnections.id,
        name: bankConnections.name,
        logoUrl: bankConnections.logoUrl,
      },
      tags: sql<Array<{ id: string; name: string | null }>>`COALESCE((
        SELECT json_agg(jsonb_build_object('id', t.id, 'name', t.name))
        FROM ${transactionTags} tt
        INNER JOIN ${tags} t ON t.id = tt.tag_id
        WHERE tt.transaction_id = ${transactions.id} AND tt.team_id = ${teamId}
      ), '[]'::json)`.as("tags"),
    })
    .from(transactions)
    .leftJoin(
      users,
      and(eq(transactions.assignedId, users.id), eq(users.teamId, teamId)),
    )
    .leftJoin(
      transactionCategories,
      and(
        eq(transactions.categorySlug, transactionCategories.slug),
        eq(transactionCategories.teamId, teamId),
      ),
    )
    .leftJoin(
      bankAccounts,
      and(
        eq(transactions.bankAccountId, bankAccounts.id),
        eq(bankAccounts.teamId, teamId),
      ),
    )
    .leftJoin(
      bankConnections,
      eq(bankAccounts.bankConnectionId, bankConnections.id),
    )
    .where(and(...finalWhereConditions));

  let query = queryBuilder.$dynamic();

  // Sorting
  if (sort && sort.length === 2) {
    const [column, direction] = sort;
    const isAscending = direction === "asc";
    const order = isAscending ? asc : desc;

    if (column === "attachment") {
      query = query.orderBy(
        order(
          sql`(EXISTS (SELECT 1 FROM ${transactionAttachments} WHERE ${eq(transactionAttachments.transactionId, transactions.id)} AND ${eq(transactionAttachments.teamId, teamId)}) OR ${transactions.status} = 'completed')`,
        ),
        order(transactions.id),
      );
    } else if (column === "assigned") {
      query = query.orderBy(order(users.fullName), order(transactions.id));
    } else if (column === "bank_account") {
      query = query.orderBy(order(bankAccounts.name), order(transactions.id));
    } else if (column === "category") {
      query = query.orderBy(
        order(transactionCategories.name),
        order(transactions.id),
      );
    } else if (column === "tags") {
      query = query.orderBy(
        order(
          sql`EXISTS (SELECT 1 FROM ${transactionTags} WHERE ${eq(transactionTags.transactionId, transactions.id)} AND ${eq(transactionTags.teamId, teamId)})`,
        ),
        order(transactions.id),
      );
    } else if (column === "date") {
      query = query.orderBy(order(transactions.date), order(transactions.id));
    } else if (column === "amount") {
      query = query.orderBy(order(transactions.amount), order(transactions.id));
    } else if (column === "name") {
      query = query.orderBy(order(transactions.name), order(transactions.id));
    } else if (column === "status") {
      query = query.orderBy(order(transactions.status), order(transactions.id));
    } else if (column === "counterparty") {
      query = query.orderBy(
        order(transactions.counterpartyName),
        order(transactions.id),
      );
    } else {
      query = query.orderBy(desc(transactions.date), desc(transactions.id));
    }
  } else {
    query = query.orderBy(desc(transactions.date), desc(transactions.id));
  }

  const offset = cursor ? Number.parseInt(cursor, 10) : 0;
  const finalQuery = query.limit(pageSize).offset(offset);

  const fetchedData = await finalQuery;

  const hasNextPage = fetchedData.length === pageSize;
  const nextCursor = hasNextPage ? (offset + pageSize).toString() : undefined;

  const processedData = fetchedData.map((row) => {
    const { account, connection, ...rest } = row;

    const newAccount = account?.id
      ? {
          ...account,
          connection: connection?.id
            ? {
                id: connection.id,
                name: connection.name,
                logoUrl: connection.logoUrl,
              }
            : null,
        }
      : null;

    const { taxAmount, taxRate, taxType } = resolveTaxValues({
      transactionAmount: rest.amount,
      transactionTaxAmount: rest.taxAmount,
      transactionTaxRate: rest.taxRate,
      transactionTaxType: rest.taxType,
      categoryTaxRate: rest.category?.taxRate,
      categoryTaxType: rest.category?.taxType,
    });

    return {
      ...rest,
      account: newAccount,
      taxRate,
      taxType,
      taxAmount,
    };
  });

  return {
    meta: {
      cursor: nextCursor,
      hasPreviousPage: offset > 0,
      hasNextPage: hasNextPage,
    },
    data: processedData,
  };
}

type GetTransactionByIdParams = {
  id: string;
  teamId: string;
};

export async function getTransactionById(
  db: Database,
  params: GetTransactionByIdParams,
) {
  const [result] = await db
    .select({
      id: transactions.id,
      date: transactions.date,
      amount: transactions.amount,
      currency: transactions.currency,
      method: transactions.method,
      status: transactions.status,
      note: transactions.note,
      manual: transactions.manual,
      internal: transactions.internal,
      recurring: transactions.recurring,
      counterpartyName: transactions.counterpartyName,
      frequency: transactions.frequency,
      name: transactions.name,
      description: transactions.description,
      createdAt: transactions.createdAt,
      taxRate: transactions.taxRate,
      taxType: transactions.taxType,
      taxAmount: transactions.taxAmount,
      baseAmount: transactions.baseAmount,
      baseCurrency: transactions.baseCurrency,
      enrichmentCompleted: transactions.enrichmentCompleted,
      isFulfilled:
        sql<boolean>`(EXISTS (SELECT 1 FROM ${transactionAttachments} WHERE ${eq(transactionAttachments.transactionId, transactions.id)} AND ${eq(transactionAttachments.teamId, params.teamId)})) OR ${transactions.status} = 'completed'`.as(
          "isFulfilled",
        ),
      hasPendingSuggestion:
        sql<boolean>`${transactionMatchSuggestions.id} IS NOT NULL`.as(
          "hasPendingSuggestion",
        ),
      suggestion: {
        suggestionId: transactionMatchSuggestions.id,
        inboxId: transactionMatchSuggestions.inboxId,
        documentName: inbox.displayName,
        documentAmount: inbox.amount,
        documentCurrency: inbox.currency,
        documentPath: inbox.filePath,
        confidenceScore: transactionMatchSuggestions.confidenceScore,
      },
      assigned: {
        id: users.id,
        fullName: users.fullName,
        avatarUrl: users.avatarUrl,
      },
      category: {
        id: transactionCategories.id,
        name: transactionCategories.name,
        color: transactionCategories.color,
        slug: transactionCategories.slug,
        taxRate: transactionCategories.taxRate,
        taxType: transactionCategories.taxType,
      },
      account: {
        id: bankAccounts.id,
        name: bankAccounts.name,
        currency: bankAccounts.currency,
      },
      connection: {
        id: bankConnections.id,
        name: bankConnections.name,
        logoUrl: bankConnections.logoUrl,
      },
      tags: sql<Array<{ id: string; name: string | null }>>`COALESCE((
        SELECT json_agg(jsonb_build_object('id', t.id, 'name', t.name))
        FROM ${transactionTags} tt
        INNER JOIN ${tags} t ON t.id = tt.tag_id
        WHERE tt.transaction_id = ${transactions.id} AND tt.team_id = ${params.teamId}
      ), '[]'::json)`.as("tags"),
      attachments: sql<
        Array<{
          id: string;
          filename: string | null;
          path: string | null;
          type: string;
          size: number;
        }>
      >`COALESCE((
        SELECT json_agg(jsonb_build_object('id', ta.id, 'filename', ta.name, 'path', ta.path, 'type', ta.type, 'size', ta.size))
        FROM ${transactionAttachments} ta
        WHERE ta.transaction_id = ${transactions.id} AND ta.team_id = ${params.teamId}
      ), '[]'::json)`.as("attachments"),
    })
    .from(transactions)
    .leftJoin(
      users,
      and(
        eq(transactions.assignedId, users.id),
        eq(users.teamId, params.teamId),
      ),
    )
    .leftJoin(
      transactionCategories,
      and(
        eq(transactions.categorySlug, transactionCategories.slug),
        eq(transactionCategories.teamId, params.teamId),
      ),
    )
    .leftJoin(
      bankAccounts,
      and(
        eq(transactions.bankAccountId, bankAccounts.id),
        eq(bankAccounts.teamId, params.teamId),
      ),
    )
    .leftJoin(
      bankConnections,
      eq(bankAccounts.bankConnectionId, bankConnections.id),
    )
    .leftJoin(
      transactionMatchSuggestions,
      and(
        eq(transactionMatchSuggestions.transactionId, transactions.id),
        eq(transactionMatchSuggestions.teamId, params.teamId),
        eq(transactionMatchSuggestions.status, "pending"),
      ),
    )
    .leftJoin(inbox, eq(inbox.id, transactionMatchSuggestions.inboxId))
    .where(
      and(
        eq(transactions.id, params.id),
        eq(transactions.teamId, params.teamId),
      ),
    )
    .limit(1);

  if (!result) {
    return null;
  }

  const { account, connection, ...rest } = result;

  const newAccount = account?.id
    ? {
        ...account,
        connection: connection?.id
          ? {
              id: connection.id,
              name: connection.name,
              logoUrl: connection.logoUrl,
            }
          : null,
      }
    : null;

  const { taxAmount, taxRate, taxType } = resolveTaxValues({
    transactionAmount: rest.amount,
    transactionTaxAmount: rest.taxAmount,
    transactionTaxRate: rest.taxRate,
    transactionTaxType: rest.taxType,
    categoryTaxRate: rest.category?.taxRate,
    categoryTaxType: rest.category?.taxType,
  });

  return {
    ...rest,
    account: newAccount,
    taxRate,
    taxType,
    taxAmount,
  };
}

// Helper function to get full transaction data by ID with the same structure as getTransactionById
async function getFullTransactionData(
  db: Database,
  transactionId: string,
  teamId: string,
) {
  return getTransactionById(db, { id: transactionId, teamId });
}

type DeleteTransactionsParams = {
  teamId: string;
  ids: string[];
};

export async function deleteTransactions(
  db: Database,
  params: DeleteTransactionsParams,
) {
  return db
    .delete(transactions)
    .where(
      and(
        inArray(transactions.id, params.ids),
        eq(transactions.manual, true),
        eq(transactions.teamId, params.teamId),
      ),
    )
    .returning({
      id: transactions.id,
    });
}

export async function deleteTransactionsByInternalIds(
  db: Database,
  params: { teamId: string; internalIds: string[] },
) {
  if (params.internalIds.length === 0) return [];

  const fullIds = params.internalIds.map((id) => `${params.teamId}_${id}`);

  return db
    .delete(transactions)
    .where(
      and(
        inArray(transactions.internalId, fullIds),
        eq(transactions.teamId, params.teamId),
      ),
    )
    .returning({ id: transactions.id });
}

const MIN_SIMILARITY_THRESHOLD = 0.6;
const EXACT_MERCHANT_SCORE = 0.95;
const MAX_CANDIDATES = 200;

type GetSimilarTransactionsParams = {
  name: string;
  teamId: string;
  categorySlug?: string;
  frequency?: "weekly" | "monthly" | "annually" | "irregular";
  transactionId?: string;
};

/**
 * Find similar transactions using pg_trgm + multi-field name scoring.
 * Designed for vendor matching: when a user changes a category or frequency,
 * find all other transactions from the same vendor across all time.
 */
export async function getSimilarTransactions(
  db: Database,
  params: GetSimilarTransactionsParams,
) {
  const { name, teamId, categorySlug, transactionId } = params;

  // Resolve the source transaction's merchant_name when we have a transactionId
  let sourceMerchantName: string | null = null;
  if (transactionId) {
    const source = await db
      .select({ merchantName: transactions.merchantName })
      .from(transactions)
      .where(
        and(
          eq(transactions.id, transactionId),
          eq(transactions.teamId, teamId),
        ),
      )
      .limit(1);

    sourceMerchantName = source[0]?.merchantName ?? null;
  }

  // Build OR conditions for candidate retrieval:
  // Path A: exact merchant_name match (handles "AMZN MKTP US" ↔ "Amazon.com" via enrichment)
  // Path B: trigram similarity on name/merchant fields
  const candidateConditions: SQL[] = [
    sql`(${name} %> ${transactions.name} OR ${name} %> ${transactions.merchantName})`,
  ];

  if (sourceMerchantName) {
    candidateConditions.push(
      sql`LOWER(${transactions.merchantName}) = LOWER(${sourceMerchantName})`,
    );
    candidateConditions.push(
      sql`(${sourceMerchantName} %> ${transactions.name} OR ${sourceMerchantName} %> ${transactions.merchantName})`,
    );
  }

  const whereConditions: (SQL | undefined)[] = [
    eq(transactions.teamId, teamId),
    or(...candidateConditions),
  ];

  if (transactionId) {
    whereConditions.push(ne(transactions.id, transactionId));
  }

  if (categorySlug) {
    whereConditions.push(
      or(
        isNull(transactions.categorySlug),
        ne(transactions.categorySlug, categorySlug),
      ),
    );
  }

  const candidates = await db.transaction(async (tx) => {
    await tx.execute(sql`SET LOCAL pg_trgm.word_similarity_threshold = 0.3`);
    return tx
      .select({
        id: transactions.id,
        amount: transactions.amount,
        teamId: transactions.teamId,
        name: transactions.name,
        date: transactions.date,
        categorySlug: transactions.categorySlug,
        frequency: transactions.frequency,
        merchantName: transactions.merchantName,
      })
      .from(transactions)
      .where(and(...(whereConditions.filter(Boolean) as SQL[])))
      .orderBy(
        sql`GREATEST(
          word_similarity(${name}, ${transactions.merchantName}),
          word_similarity(${name}, ${transactions.name})
        ) DESC`,
      )
      .limit(MAX_CANDIDATES);
  });

  // Score each candidate using a cross-field comparison matrix
  const scored = candidates
    .map((candidate) => {
      // Exact merchant_name match is the strongest signal
      if (
        sourceMerchantName &&
        candidate.merchantName &&
        sourceMerchantName.toLowerCase() ===
          candidate.merchantName.toLowerCase()
      ) {
        return { ...candidate, score: EXACT_MERCHANT_SCORE };
      }

      // Cross-field comparison matrix: try source name and source merchant
      // against candidate name and candidate merchant. calculateNameScore
      // already compares the first arg against both the second and third args.
      const scores: number[] = [
        calculateNameScore(name, candidate.name, candidate.merchantName),
      ];

      if (sourceMerchantName) {
        scores.push(
          calculateNameScore(
            sourceMerchantName,
            candidate.name,
            candidate.merchantName,
          ),
        );
      }

      return { ...candidate, score: Math.max(...scores) };
    })
    .filter((r) => r.score >= MIN_SIMILARITY_THRESHOLD)
    .sort((a, b) => b.score - a.score);

  logger.info("getSimilarTransactions completed", {
    name,
    teamId,
    sourceMerchantName,
    candidatesRetrieved: candidates.length,
    resultsAfterScoring: scored.length,
  });

  return scored.map(({ merchantName: _m, score: _s, ...rest }) => rest);
}

type SearchTransactionMatchParams = {
  teamId: string;
  inboxId?: string;
  query?: string;
  maxResults?: number;
  minConfidenceScore?: number;
  includeAlreadyMatched?: boolean;
};

type SearchTransactionMatchResult = {
  transaction_id: string;
  name: string;
  transaction_amount: number;
  transaction_currency: string;
  transaction_date: string;
  name_score: number;
  amount_score: number;
  currency_score: number;
  date_score: number;
  confidence_score: number;
  is_already_matched: boolean;
  matched_attachment_filename?: string;
};

export async function searchTransactionMatch(
  db: Database,
  params: SearchTransactionMatchParams,
): Promise<SearchTransactionMatchResult[]> {
  const {
    teamId,
    query,
    inboxId,
    maxResults = 5,
    minConfidenceScore = 0.5,
    includeAlreadyMatched = false,
  } = params;

  if (query) {
    const searchTerm = query.trim();
    if (!searchTerm) return [];

    // Fetch inbox context for scoring when available
    let inboxContext: {
      displayName: string | null;
      amount: number | null;
      currency: string | null;
      date: string | null;
      baseAmount: number | null;
      baseCurrency: string | null;
    } | null = null;

    if (inboxId) {
      const [item] = await db
        .select({
          displayName: inbox.displayName,
          amount: inbox.amount,
          currency: inbox.currency,
          date: inbox.date,
          baseAmount: inbox.baseAmount,
          baseCurrency: inbox.baseCurrency,
        })
        .from(inbox)
        .where(and(eq(inbox.id, inboxId), eq(inbox.teamId, teamId)))
        .limit(1);
      inboxContext = item ?? null;
    }

    const numericValue = Number.parseFloat(searchTerm.replace(/[^\d.-]/g, ""));
    const isNumeric =
      !Number.isNaN(numericValue) && Number.isFinite(numericValue);

    const searchQuery = buildSearchQuery(searchTerm);

    const whereConditions: SQL[] = [
      eq(transactions.teamId, teamId),
      eq(transactions.status, "posted"),
    ];

    if (!includeAlreadyMatched) {
      whereConditions.push(
        sql`NOT EXISTS (SELECT 1 FROM ${transactionAttachments} WHERE ${eq(transactionAttachments.transactionId, transactions.id)} AND ${eq(transactionAttachments.teamId, teamId)})`,
      );
    }

    if (isNumeric) {
      const tolerance = Math.max(1, Math.abs(numericValue) * 0.1);
      whereConditions.push(
        or(
          sql`ABS(ABS(${transactions.amount}) - ${numericValue}) <= ${tolerance}`,
          sql`ABS(ABS(COALESCE(${transactions.baseAmount}, 0)) - ${numericValue}) <= ${tolerance}`,
          sql`to_tsquery('english', ${searchQuery}) @@ ${transactions.ftsVector}`,
          sql`${transactions.name} ILIKE '%' || ${searchTerm} || '%'`,
          sql`${transactions.merchantName} ILIKE '%' || ${searchTerm} || '%'`,
        )!,
      );
    } else {
      whereConditions.push(
        or(
          sql`to_tsquery('english', ${searchQuery}) @@ ${transactions.ftsVector}`,
          sql`${transactions.name} ILIKE '%' || ${searchTerm} || '%'`,
          sql`${transactions.merchantName} ILIKE '%' || ${searchTerm} || '%'`,
          sql`${transactions.description} ILIKE '%' || ${searchTerm} || '%'`,
        )!,
      );
    }

    // Fetch more candidates than needed so we can score and re-rank
    const fetchLimit = inboxContext ? Math.max(maxResults * 3, 30) : maxResults;

    const candidates = await db
      .select({
        transactionId: transactions.id,
        name: transactions.name,
        transactionAmount: transactions.amount,
        transactionCurrency: transactions.currency,
        transactionDate: transactions.date,
        merchantName: transactions.merchantName,
        baseAmount: transactions.baseAmount,
        baseCurrency: transactions.baseCurrency,
        isAlreadyMatched: sql<boolean>`
            EXISTS (SELECT 1 FROM ${transactionAttachments} WHERE ${eq(transactionAttachments.transactionId, transactions.id)} AND ${eq(transactionAttachments.teamId, teamId)})
          `.as("is_already_matched"),
        attachmentFilename: sql<string | null>`
            (SELECT ${transactionAttachments.name} FROM ${transactionAttachments}
             WHERE ${eq(transactionAttachments.transactionId, transactions.id)} AND ${eq(transactionAttachments.teamId, teamId)}
             LIMIT 1)
          `.as("attachment_filename"),
      })
      .from(transactions)
      .where(and(...whereConditions))
      .orderBy(desc(transactions.date))
      .limit(fetchLimit);

    if (!inboxContext) {
      return candidates.slice(0, maxResults).map((r) => ({
        transaction_id: r.transactionId,
        name: r.name,
        transaction_amount: r.transactionAmount,
        transaction_currency: r.transactionCurrency,
        transaction_date: r.transactionDate,
        name_score: 0,
        amount_score: 0,
        currency_score: 0,
        date_score: 0,
        confidence_score: 0,
        is_already_matched: r.isAlreadyMatched,
        matched_attachment_filename: r.attachmentFilename ?? undefined,
      }));
    }

    return candidates
      .map((t) => {
        const nameScore = calculateNameScore(
          inboxContext.displayName,
          t.name,
          t.merchantName,
        );
        const amountScore = calculateAmountScore(
          {
            amount: inboxContext.amount,
            currency: inboxContext.currency,
            baseAmount: inboxContext.baseAmount,
            baseCurrency: inboxContext.baseCurrency,
          },
          {
            amount: t.transactionAmount,
            currency: t.transactionCurrency,
            baseAmount: t.baseAmount,
            baseCurrency: t.baseCurrency,
          },
        );
        const currencyScore = calculateCurrencyScore(
          inboxContext.currency || undefined,
          t.transactionCurrency || undefined,
          inboxContext.baseCurrency || undefined,
          t.baseCurrency || undefined,
        );
        const dateScore = inboxContext.date
          ? calculateDateScore(inboxContext.date, t.transactionDate)
          : 0;
        const isExactAmount =
          inboxContext.amount !== null &&
          Math.abs(
            Math.abs(inboxContext.amount || 0) -
              Math.abs(t.transactionAmount || 0),
          ) < 0.01;
        const isSameCurrency = inboxContext.currency === t.transactionCurrency;
        const confidence = scoreMatch({
          nameScore,
          amountScore,
          dateScore,
          currencyScore,
          isSameCurrency,
          isExactAmount,
        });

        return {
          transaction_id: t.transactionId,
          name: t.name,
          transaction_amount: t.transactionAmount,
          transaction_currency: t.transactionCurrency,
          transaction_date: t.transactionDate,
          name_score: Math.round(nameScore * 1000) / 1000,
          amount_score: Math.round(amountScore * 1000) / 1000,
          currency_score: Math.round(currencyScore * 1000) / 1000,
          date_score: Math.round(dateScore * 1000) / 1000,
          confidence_score: Math.round(confidence * 1000) / 1000,
          is_already_matched: t.isAlreadyMatched,
          matched_attachment_filename: t.attachmentFilename ?? undefined,
        };
      })
      .sort((a, b) => {
        if (a.confidence_score !== b.confidence_score)
          return b.confidence_score - a.confidence_score;
        if (a.is_already_matched !== b.is_already_matched)
          return a.is_already_matched ? 1 : -1;
        return 0;
      })
      .slice(0, maxResults);
  }

  if (inboxId) {
    try {
      const inboxItem = await db
        .select({
          id: inbox.id,
          displayName: inbox.displayName,
          amount: inbox.amount,
          currency: inbox.currency,
          date: inbox.date,
          baseAmount: inbox.baseAmount,
          baseCurrency: inbox.baseCurrency,
        })
        .from(inbox)
        .where(and(eq(inbox.id, inboxId), eq(inbox.teamId, teamId)))
        .limit(1);

      if (!inboxItem.length) {
        return [];
      }

      const item = inboxItem[0]!;
      const inboxAmount = Math.abs(item.amount || 0);
      const inboxBaseAmount = Math.abs(item.baseAmount || 0);

      const candidateTransactions = await db.transaction(async (tx) => {
        await tx.execute(
          sql`SET LOCAL pg_trgm.word_similarity_threshold = 0.3`,
        );
        return tx
          .select({
            transactionId: transactions.id,
            name: transactions.name,
            transactionAmount: transactions.amount,
            transactionCurrency: transactions.currency,
            transactionDate: transactions.date,
            baseAmount: transactions.baseAmount,
            baseCurrency: transactions.baseCurrency,
            isAlreadyMatched: sql<boolean>`
              (EXISTS (SELECT 1 FROM ${transactionAttachments} WHERE ${eq(transactionAttachments.transactionId, transactions.id)} AND ${eq(transactionAttachments.teamId, teamId)}) OR ${transactions.status} = 'completed')
            `.as("is_already_matched"),
            attachmentFilename: sql<string | null>`
              (SELECT ${transactionAttachments.name} FROM ${transactionAttachments} 
               WHERE ${eq(transactionAttachments.transactionId, transactions.id)} AND ${eq(transactionAttachments.teamId, teamId)} 
               LIMIT 1)
            `.as("attachment_filename"),
            merchantName: transactions.merchantName,
          })
          .from(transactions)
          .where(
            and(
              eq(transactions.teamId, teamId),
              eq(transactions.status, "posted"),
              sql`${transactions.date} IS NOT NULL`,
              sql`${transactions.date} BETWEEN ${item.date}::date - INTERVAL '90 days' AND ${item.date}::date + INTERVAL '30 days'`,
              ...(includeAlreadyMatched
                ? []
                : [
                    sql`NOT (EXISTS (SELECT 1 FROM ${transactionAttachments} WHERE ${eq(transactionAttachments.transactionId, transactions.id)} AND ${eq(transactionAttachments.teamId, teamId)}) OR ${transactions.status} = 'completed')`,
                  ]),
              or(
                and(
                  eq(transactions.currency, item.currency ?? ""),
                  sql`ABS(ABS(${transactions.amount}) - ${inboxAmount}) < GREATEST(1, ${inboxAmount} * 0.25)`,
                ),
                sql`(${item.displayName ?? ""} %> ${transactions.name} OR ${item.displayName ?? ""} %> ${transactions.merchantName})`,
                and(
                  sql`${transactions.baseCurrency} IS NOT NULL`,
                  sql`${item.baseCurrency ?? ""} != ''`,
                  eq(transactions.baseCurrency, item.baseCurrency ?? ""),
                  sql`ABS(ABS(COALESCE(${transactions.baseAmount}, 0)) - ${inboxBaseAmount}) < GREATEST(50, ${inboxBaseAmount} * 0.15)`,
                ),
              ),
            ),
          )
          .orderBy(
            sql`GREATEST(word_similarity(${item.displayName ?? ""}, ${transactions.name}), word_similarity(${item.displayName ?? ""}, ${transactions.merchantName})) DESC`,
            sql`ABS(ABS(${transactions.amount}) - ${inboxAmount}) / GREATEST(1.0, ${inboxAmount})`,
            sql`ABS(${transactions.date} - ${item.date}::date)`,
          )
          .limit(Math.max(maxResults * 3, 30));
      });

      const scoredResults = candidateTransactions
        .map((transaction) => {
          const nameScore = calculateNameScore(
            item.displayName,
            transaction.name,
            transaction.merchantName,
          );
          const amountScore = calculateAmountScore(
            {
              amount: item.amount,
              currency: item.currency,
              baseAmount: item.baseAmount,
              baseCurrency: item.baseCurrency,
            },
            {
              amount: transaction.transactionAmount,
              currency: transaction.transactionCurrency,
              baseAmount: transaction.baseAmount,
              baseCurrency: transaction.baseCurrency,
            },
          );
          const currencyScore = calculateCurrencyScore(
            item.currency || undefined,
            transaction.transactionCurrency || undefined,
            item.baseCurrency || undefined,
            transaction.baseCurrency || undefined,
          );
          const dateScore = calculateDateScore(
            item.date!,
            transaction.transactionDate,
          );
          const isExactAmount =
            item.amount !== null &&
            Math.abs(
              Math.abs(item.amount || 0) -
                Math.abs(transaction.transactionAmount || 0),
            ) < 0.01;
          const isSameCurrency =
            item.currency === transaction.transactionCurrency;
          const confidence = scoreMatch({
            nameScore,
            amountScore,
            dateScore,
            currencyScore,
            isSameCurrency,
            isExactAmount,
          });

          const result = {
            transaction_id: transaction.transactionId,
            name: transaction.name,
            transaction_amount: transaction.transactionAmount,
            transaction_currency: transaction.transactionCurrency,
            transaction_date: transaction.transactionDate,
            name_score: Math.round(nameScore * 1000) / 1000,
            amount_score: Math.round(amountScore * 1000) / 1000,
            currency_score: Math.round(currencyScore * 1000) / 1000,
            date_score: Math.round(dateScore * 1000) / 1000,
            confidence_score: Math.round(confidence * 1000) / 1000,
            is_already_matched: transaction.isAlreadyMatched,
            matched_attachment_filename:
              transaction.attachmentFilename ?? undefined,
          };

          return result;
        })
        .filter((result) => result.confidence_score >= minConfidenceScore)
        .sort((a, b) => {
          if (a.confidence_score !== b.confidence_score) {
            return b.confidence_score - a.confidence_score;
          }

          if (a.is_already_matched !== b.is_already_matched) {
            return a.is_already_matched ? 1 : -1;
          }

          return 0;
        })
        .slice(0, maxResults);

      return scoredResults;
    } catch {
      return [];
    }
  }

  return [];
}

type UpdateTransactionData = {
  id: string;
  teamId: string;
  userId?: string;
  name?: string;
  amount?: number;
  currency?: string;
  date?: string;
  bankAccountId?: string;
  categorySlug?: string | null;
  status?:
    | "pending"
    | "archived"
    | "completed"
    | "posted"
    | "excluded"
    | "exported"
    | null;
  internal?: boolean;
  note?: string | null;
  assignedId?: string | null;
  recurring?: boolean;
  frequency?: "weekly" | "monthly" | "annually" | "irregular" | null;
  taxRate?: number | null;
  taxAmount?: number | null;
  taxType?: string | null;
};

export async function updateTransaction(
  db: Database,
  params: UpdateTransactionData,
) {
  const { id, teamId, userId, ...dataToUpdate } = params;

  // If category is being changed, clear tax fields so category's tax rate is used
  if (dataToUpdate.categorySlug !== undefined) {
    dataToUpdate.taxRate = null;
    dataToUpdate.taxAmount = null;
    dataToUpdate.taxType = null;
  }

  const [result] = await db
    .update(transactions)
    .set(dataToUpdate)
    .where(and(eq(transactions.id, id), eq(transactions.teamId, teamId)))
    .returning({
      id: transactions.id,
    });

  if (!result) {
    return null;
  }

  // If status is being changed from "exported" to something else, delete accounting sync records
  // This ensures transactions are properly unmarked as exported
  if (dataToUpdate.status !== undefined && dataToUpdate.status !== "exported") {
    await db
      .delete(accountingSyncRecords)
      .where(
        and(
          eq(accountingSyncRecords.transactionId, id),
          eq(accountingSyncRecords.teamId, teamId),
        ),
      );
  }

  if (dataToUpdate.categorySlug) {
    createActivity(db, {
      teamId,
      userId,
      type: "transactions_categorized",
      source: "user",
      priority: 7,
      metadata: {
        categorySlug: dataToUpdate.categorySlug,
        transactionIds: [result.id],
        transactionCount: 1,
      },
    });
  }

  if (dataToUpdate.assignedId) {
    createActivity(db, {
      teamId,
      userId,
      type: "transactions_assigned",
      source: "user",
      priority: 7,
      metadata: {
        assignedUserId: dataToUpdate.assignedId,
        transactionIds: [result.id],
        transactionCount: 1,
      },
    });
  }

  return getFullTransactionData(db, result.id, teamId);
}

export type GetTransactionsByIdsParams = {
  ids: string[];
  teamId: string;
};

export async function getTransactionsByIds(
  db: Database,
  params: GetTransactionsByIdsParams,
) {
  const { ids, teamId } = params;

  if (ids.length === 0) {
    return [];
  }

  // Return snake_case structure to match Supabase REST API response format
  const results = await db
    .select({
      id: transactions.id,
      date: transactions.date,
      name: transactions.name,
      description: transactions.description,
      amount: transactions.amount,
      note: transactions.note,
      balance: transactions.balance,
      currency: transactions.currency,
      counterparty_name: transactions.counterpartyName,
      tax_type: transactions.taxType,
      tax_rate: transactions.taxRate,
      tax_amount: transactions.taxAmount,
      base_amount: transactions.baseAmount,
      base_currency: transactions.baseCurrency,
      status: transactions.status,
      attachments: sql<
        Array<{
          id: string;
          name: string | null;
          path: string[] | null;
          type: string | null;
          size: number | null;
        }>
      >`COALESCE((
        SELECT json_agg(jsonb_build_object('id', ta.id, 'name', ta.name, 'path', ta.path, 'type', ta.type, 'size', ta.size))
        FROM ${transactionAttachments} ta
        WHERE ta.transaction_id = ${transactions.id} AND ta.team_id = ${teamId}
      ), '[]'::json)`.as("attachments"),
      category: sql<{
        id: string;
        name: string | null;
        description: string | null;
        tax_rate: number | null;
        tax_type: string | null;
        tax_reporting_code: string | null;
      } | null>`json_build_object('id', ${transactionCategories.id}, 'name', ${transactionCategories.name}, 'description', ${transactionCategories.description}, 'tax_rate', ${transactionCategories.taxRate}, 'tax_type', ${transactionCategories.taxType}, 'tax_reporting_code', ${transactionCategories.taxReportingCode})`.as(
        "category",
      ),
      bank_account: sql<{
        id: string;
        name: string | null;
      } | null>`json_build_object('id', ${bankAccounts.id}, 'name', ${bankAccounts.name})`.as(
        "bank_account",
      ),
      tags: sql<
        Array<{ id: string; tag: { id: string; name: string | null } }>
      >`COALESCE((
        SELECT json_agg(jsonb_build_object('id', tt.id, 'tag', jsonb_build_object('id', t.id, 'name', t.name)))
        FROM ${transactionTags} tt
        INNER JOIN ${tags} t ON t.id = tt.tag_id
        WHERE tt.transaction_id = ${transactions.id} AND tt.team_id = ${teamId}
      ), '[]'::json)`.as("tags"),
    })
    .from(transactions)
    .leftJoin(
      transactionCategories,
      and(
        eq(transactions.categorySlug, transactionCategories.slug),
        eq(transactionCategories.teamId, teamId),
      ),
    )
    .leftJoin(
      bankAccounts,
      and(
        eq(transactions.bankAccountId, bankAccounts.id),
        eq(bankAccounts.teamId, teamId),
      ),
    )
    .where(and(inArray(transactions.id, ids), eq(transactions.teamId, teamId)));

  return results;
}

type UpdateTransactionsData = {
  ids: string[];
  teamId: string;
  userId?: string;
  categorySlug?: string | null;
  status?:
    | "pending"
    | "archived"
    | "completed"
    | "posted"
    | "excluded"
    | "exported"
    | null;
  internal?: boolean;
  note?: string | null;
  assignedId?: string | null;
  tagId?: string | null;
  recurring?: boolean;
  frequency?: "weekly" | "monthly" | "annually" | "irregular" | null;
  taxRate?: number | null;
  taxAmount?: number | null;
  taxType?: string | null;
};

export async function updateTransactions(
  db: Database,
  data: UpdateTransactionsData,
) {
  const { ids, tagId, teamId, userId, ...input } = data;

  // If category is being changed, clear tax fields so category's tax rate is used
  if (input.categorySlug !== undefined) {
    input.taxRate = null;
    input.taxAmount = null;
    input.taxType = null;
  }

  if (tagId) {
    await db
      .insert(transactionTags)
      .values(
        ids.map((id) => ({
          transactionId: id,
          tagId,
          teamId,
        })),
      )
      .onConflictDoNothing();
  }

  let results: { id: string }[] = [];

  // Only update transactions if there are fields to update
  if (Object.keys(input).length > 0) {
    results = await db
      .update(transactions)
      .set(input)
      .where(
        and(eq(transactions.teamId, teamId), inArray(transactions.id, ids)),
      )
      .returning({
        id: transactions.id,
      });
  } else {
    // If no fields to update, just return the transaction IDs
    results = ids.map((id) => ({ id }));
  }

  // If status is being changed from "exported" to something else, delete accounting sync records
  // This ensures transactions are properly unmarked as exported
  if (input.status !== undefined && input.status !== "exported") {
    await db
      .delete(accountingSyncRecords)
      .where(
        and(
          eq(accountingSyncRecords.teamId, teamId),
          inArray(accountingSyncRecords.transactionId, ids),
        ),
      );
  }

  // Create activities for transaction updates
  if (results.length > 0) {
    // Create bulk activity for categorization
    if (input.categorySlug) {
      createActivity(db, {
        teamId,
        userId,
        type: "transactions_categorized",
        source: "user",
        priority: 7,
        metadata: {
          categorySlug: input.categorySlug,
          transactionIds: results.map((r) => r.id),
          transactionCount: results.length,
        },
      });
    }

    // Create bulk activity for assignment
    if (input.assignedId) {
      createActivity(db, {
        teamId,
        userId,
        type: "transactions_assigned",
        source: "user",
        priority: 7,
        metadata: {
          assignedUserId: input.assignedId,
          transactionIds: results.map((r) => r.id),
          transactionCount: results.length,
        },
      });
    }
  }

  // Get full transaction data for each updated transaction
  const fullTransactions = await Promise.all(
    results.map((result) => getFullTransactionData(db, result.id, teamId)),
  );

  // Filter out any null results
  return fullTransactions.filter((transaction) => transaction !== null);
}

export type CreateTransactionParams = {
  name: string;
  amount: number;
  currency: string;
  teamId: string;
  date: string;
  bankAccountId: string;
  assignedId?: string | null;
  categorySlug?: string | null;
  note?: string | null;
  internal?: boolean;
  attachments?: Attachment[];
};

export async function createTransaction(
  db: Database,
  params: CreateTransactionParams,
) {
  const {
    teamId,
    attachments,
    bankAccountId,
    categorySlug,
    assignedId,
    ...rest
  } = params;

  const [result] = await db
    .insert(transactions)
    .values({
      ...rest,
      teamId,
      bankAccountId,
      categorySlug,
      assignedId,
      method: "other",
      manual: true,
      notified: true,
      status: "posted",
      internalId: `${teamId}_${nanoid()}`,
    })
    .returning({
      id: transactions.id,
    });

  if (!result) {
    return null;
  }

  if (attachments) {
    await createAttachments(db, {
      attachments: attachments.map((attachment) => ({
        ...attachment,
        transactionId: result.id,
      })),
      teamId,
    });
  }

  return getFullTransactionData(db, result.id, teamId);
}

export async function createTransactions(
  db: Database,
  params: CreateTransactionParams[],
) {
  const transactionsToInsert = params.map(
    ({ attachments, teamId, ...rest }) => {
      return {
        ...rest,
        teamId,
        method: "other" as const,
        manual: true,
        notified: true,
        status: "posted" as const,
        internalId: `${teamId}_${nanoid()}`,
      };
    },
  );

  const results = await db
    .insert(transactions)
    .values(transactionsToInsert)
    .returning({
      id: transactions.id,
      teamId: transactions.teamId,
    });

  // Get full transaction data for each created transaction
  const fullTransactions = await Promise.all(
    results.map((result) =>
      getFullTransactionData(db, result.id, result.teamId),
    ),
  );

  // Filter out any null results
  return fullTransactions.filter((transaction) => transaction !== null);
}

export type UpsertTransactionData = {
  name: string;
  date: string;
  method: "other" | "card_purchase" | "transfer";
  amount: number;
  currency: string;
  teamId: string;
  bankAccountId: string | null;
  internalId: string;
  status: "pending" | "completed" | "archived" | "posted" | "excluded";
  manual: boolean;
  categorySlug?: string | null;
  description?: string | null;
  balance?: number | null;
  note?: string | null;
  counterpartyName?: string | null;
  merchantName?: string | null;
  assignedId?: string | null;
  internal?: boolean;
  notified?: boolean;
  baseAmount?: number | null;
  baseCurrency?: string | null;
  taxAmount?: number | null;
  taxRate?: number | null;
  taxType?: string | null;
  recurring?: boolean;
  frequency?:
    | "weekly"
    | "biweekly"
    | "monthly"
    | "semi_monthly"
    | "annually"
    | "irregular"
    | "unknown"
    | null;
  enrichmentCompleted?: boolean;
};

export type UpsertTransactionsParams = {
  transactions: UpsertTransactionData[];
  teamId: string;
};

/**
 * Bulk upsert transactions with conflict handling on internalId
 * Used by import-transactions processor. Skips duplicates (onConflictDoNothing).
 */
export async function upsertTransactions(
  db: Database,
  params: UpsertTransactionsParams,
): Promise<Array<{ id: string }>> {
  // Exclude teamId from the params
  const { transactions: transactionsData, teamId: _teamId } = params;
  if (transactionsData.length === 0) {
    return [];
  }

  const upserted = await db
    .insert(transactions)
    .values(transactionsData)
    .onConflictDoNothing({
      target: [transactions.internalId],
    })
    .returning({
      id: transactions.id,
    });

  return upserted;
}

export type GetTransactionsByAccountIdParams = {
  accountId: string;
  teamId: string;
};

/**
 * Get all transactions for a specific account
 * Used by update-account-base-currency processor
 */
export async function getTransactionsByAccountId(
  db: Database,
  params: GetTransactionsByAccountIdParams,
) {
  const { accountId, teamId } = params;

  return db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.bankAccountId, accountId),
        eq(transactions.teamId, teamId),
      ),
    );
}

export type GetTransactionCountByBankAccountIdParams = {
  bankAccountId: string;
  teamId: string;
};

/**
 * Get transaction count for a bank account
 * Used by delete bank account dialog to show impact
 */
export async function getTransactionCountByBankAccountId(
  db: Database,
  params: GetTransactionCountByBankAccountIdParams,
): Promise<number> {
  const { bankAccountId, teamId } = params;

  const [result] = await db
    .select({
      count: sql<number>`COUNT(*)::int`.as("count"),
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.bankAccountId, bankAccountId),
        eq(transactions.teamId, teamId),
      ),
    );

  return result?.count ?? 0;
}

export type BulkUpdateTransactionsBaseCurrencyParams = {
  transactions: Array<{
    id: string;
    baseAmount: number;
    baseCurrency: string;
  }>;
  teamId: string;
};

/**
 * Bulk update transactions with base currency/amount
 * Uses per-row updates in a transaction — avoids array serialization issues
 * with postgres.js + Drizzle (unnest expands arrays into many params).
 */
export async function bulkUpdateTransactionsBaseCurrency(
  db: Database,
  params: BulkUpdateTransactionsBaseCurrencyParams,
) {
  const { transactions: transactionsData, teamId } = params;

  if (!teamId?.trim()) {
    throw new Error("bulkUpdateTransactionsBaseCurrency: teamId is required");
  }

  if (transactionsData.length === 0) return;

  const BATCH_SIZE = 100;
  const CONCURRENCY = 10;

  for (let i = 0; i < transactionsData.length; i += BATCH_SIZE) {
    const batch = transactionsData.slice(i, i + BATCH_SIZE);
    await db.transaction(async (tx) => {
      for (let j = 0; j < batch.length; j += CONCURRENCY) {
        const chunk = batch.slice(j, j + CONCURRENCY);
        await Promise.all(
          chunk.map((item) =>
            tx
              .update(transactions)
              .set({
                baseAmount: item.baseAmount,
                baseCurrency: item.baseCurrency,
              })
              .where(
                and(
                  eq(transactions.id, item.id),
                  eq(transactions.teamId, teamId),
                ),
              ),
          ),
        );
      }
    });
  }
}

/**
 * Count transactions that are ready for export to accounting software
 *
 * Ready for export means:
 * - Fulfilled (has attachments OR status = 'completed')
 * - Not excluded or archived
 * - Not already synced to any accounting provider with status 'synced'
 */
export async function getTransactionsReadyForExportCount(
  db: Database,
  teamId: string,
): Promise<number> {
  const result = await db
    .select({
      count: sql<number>`COUNT(DISTINCT ${transactions.id})`.as("count"),
    })
    .from(transactions)
    .leftJoin(
      transactionAttachments,
      and(
        eq(transactionAttachments.transactionId, transactions.id),
        eq(transactionAttachments.teamId, teamId),
      ),
    )
    .leftJoin(
      accountingSyncRecords,
      and(
        eq(accountingSyncRecords.transactionId, transactions.id),
        eq(accountingSyncRecords.teamId, teamId),
        eq(accountingSyncRecords.status, "synced"),
      ),
    )
    .where(
      and(
        eq(transactions.teamId, teamId),
        // Not exported, excluded, or archived
        sql`${transactions.status} NOT IN ('exported', 'excluded', 'archived')`,
        // Not already synced
        isNull(accountingSyncRecords.id),
      ),
    )
    .groupBy(transactions.id)
    // Fulfilled: has attachments OR status = 'completed'
    .having(
      sql`(COUNT(${transactionAttachments.id}) > 0 OR ${transactions.status} = 'completed')`,
    );

  // The query returns one row per fulfilled transaction, so we count the rows
  return result.length;
}

/**
 * Mark transactions as exported (for file exports)
 * This removes them from the review tab
 */
export async function markTransactionsAsExported(
  db: Database,
  transactionIds: string[],
  teamId: string,
): Promise<void> {
  if (transactionIds.length === 0) return;

  await db
    .update(transactions)
    .set({ status: "exported" })
    .where(
      and(
        inArray(transactions.id, transactionIds),
        eq(transactions.teamId, teamId),
      ),
    );
}

/**
 * Move a transaction back to review by resetting its export status
 * This handles both file exports (status = 'exported') and accounting exports (sync records)
 */
export async function moveTransactionToReview(
  db: Database,
  params: { transactionId: string; teamId: string },
): Promise<void> {
  // Reset status if it's 'exported' (file export)
  await db
    .update(transactions)
    .set({ status: "posted" })
    .where(
      and(
        eq(transactions.id, params.transactionId),
        eq(transactions.teamId, params.teamId),
        eq(transactions.status, "exported"),
      ),
    );

  // Delete accounting sync records (accounting export)
  await db
    .delete(accountingSyncRecords)
    .where(
      and(
        eq(accountingSyncRecords.transactionId, params.transactionId),
        eq(accountingSyncRecords.teamId, params.teamId),
      ),
    );
}
