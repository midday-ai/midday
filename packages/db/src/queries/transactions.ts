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
  cosineDistance,
  desc,
  eq,
  gt,
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
  transactionEmbeddings,
  type transactionFrequencyEnum,
  transactionMatchSuggestions,
  transactions,
  transactionTags,
  users,
} from "../schema";
import { createActivity } from "./activities";
import { type Attachment, createAttachments } from "./transaction-attachments";

const logger = createLoggerWithContext("transactions");

export type GetTransactionsParams = {
  teamId: string;
  cursor?: string | null;
  sort?: string[] | null;
  pageSize?: number;
  q?: string | null;
  statuses?: string[] | null;
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
    const numericQ = Number.parseFloat(q);
    if (!Number.isNaN(numericQ)) {
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

  // Status filtering - simplified logic using direct EXISTS subqueries
  if (statuses?.includes("uncompleted") || attachments === "exclude") {
    // Transaction is NOT fulfilled (no attachments AND status is not completed) AND status is not excluded
    whereConditions.push(
      sql`NOT (EXISTS (SELECT 1 FROM ${transactionAttachments} WHERE ${eq(transactionAttachments.transactionId, transactions.id)} AND ${eq(transactionAttachments.teamId, teamId)}) OR ${transactions.status} = 'completed') AND ${transactions.status} != 'excluded'`,
    );
  } else if (statuses?.includes("completed") || attachments === "include") {
    // Transaction is fulfilled (has attachments OR status is completed)
    whereConditions.push(
      sql`(EXISTS (SELECT 1 FROM ${transactionAttachments} WHERE ${eq(transactionAttachments.transactionId, transactions.id)} AND ${eq(transactionAttachments.teamId, teamId)}) OR ${transactions.status} = 'completed')`,
    );
  } else if (statuses?.includes("excluded")) {
    whereConditions.push(eq(transactions.status, "excluded"));
  } else if (statuses?.includes("archived")) {
    whereConditions.push(eq(transactions.status, "archived"));
  } else if (statuses?.includes("exported")) {
    // Show all exported transactions: manually marked OR synced to accounting provider
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
  } else {
    // Default: pending, posted, completed, or exported (exclude archived/excluded)
    whereConditions.push(
      inArray(transactions.status, [
        "pending",
        "posted",
        "completed",
        "exported",
      ]),
    );
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
      >`COALESCE(json_agg(DISTINCT jsonb_build_object('id', ${transactionAttachments.id}, 'filename', ${transactionAttachments.name}, 'path', ${transactionAttachments.path}, 'type', ${transactionAttachments.type}, 'size', ${transactionAttachments.size})) FILTER (WHERE ${transactionAttachments.id} IS NOT NULL), '[]'::json)`.as(
        "attachments",
      ),
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
      tags: sql<
        Array<{ id: string; name: string | null }>
      >`COALESCE(json_agg(DISTINCT jsonb_build_object('id', ${tags.id}, 'name', ${tags.name})) FILTER (WHERE ${tags.id} IS NOT NULL), '[]'::json)`.as(
        "tags",
      ),
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
    .leftJoin(
      transactionTags,
      and(
        eq(transactionTags.transactionId, transactions.id),
        eq(transactionTags.teamId, teamId),
      ),
    )
    .leftJoin(
      tags,
      and(eq(tags.id, transactionTags.tagId), eq(tags.teamId, teamId)),
    )
    .leftJoin(
      transactionAttachments,
      and(
        eq(transactionAttachments.transactionId, transactions.id),
        eq(transactionAttachments.teamId, teamId),
      ),
    )
    .where(and(...finalWhereConditions))
    .groupBy(
      transactions.id,
      transactions.date,
      transactions.amount,
      transactions.currency,
      transactions.method,
      transactions.status,
      transactions.note,
      transactions.manual,
      transactions.internal,
      transactions.recurring,
      transactions.frequency,
      transactions.name,
      transactions.description,
      transactions.createdAt,
      users.id,
      users.fullName,
      users.email,
      users.avatarUrl,
      transactionCategories.id,
      transactionCategories.name,
      transactionCategories.color,
      transactionCategories.slug,
      transactionCategories.taxRate,
      transactionCategories.taxType,
      bankAccounts.id,
      bankAccounts.name,
      bankAccounts.currency,
      bankConnections.id,
      bankConnections.logoUrl,
    );

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

    const newAccount = {
      ...account,
      connection: connection?.id
        ? {
            id: connection.id,
            name: connection.name,
            logoUrl: connection.logoUrl,
          }
        : null,
    };

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
      tags: sql<
        Array<{ id: string; name: string | null }>
      >`COALESCE(json_agg(DISTINCT jsonb_build_object('id', ${tags.id}, 'name', ${tags.name})) FILTER (WHERE ${tags.id} IS NOT NULL), '[]'::json)`.as(
        "tags",
      ),
      attachments: sql<
        Array<{
          id: string;
          filename: string | null;
          path: string | null;
          type: string;
          size: number;
        }>
      >`COALESCE(json_agg(DISTINCT jsonb_build_object('id', ${transactionAttachments.id}, 'filename', ${transactionAttachments.name}, 'path', ${transactionAttachments.path}, 'type', ${transactionAttachments.type}, 'size', ${transactionAttachments.size})) FILTER (WHERE ${transactionAttachments.id} IS NOT NULL), '[]'::json)`.as(
        "attachments",
      ),
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
      // For transactionTags aggregation
      transactionTags,
      and(
        eq(transactionTags.transactionId, transactions.id),
        eq(transactionTags.teamId, params.teamId),
      ),
    )
    .leftJoin(
      // For transactionTags aggregation
      tags,
      and(eq(tags.id, transactionTags.tagId), eq(tags.teamId, params.teamId)),
    )
    .leftJoin(
      // For attachments aggregation
      transactionAttachments,
      and(
        eq(transactionAttachments.transactionId, transactions.id),
        eq(transactionAttachments.teamId, params.teamId),
      ),
    )
    .leftJoin(
      // Get any pending suggestion
      transactionMatchSuggestions,
      and(
        eq(transactionMatchSuggestions.transactionId, transactions.id),
        eq(transactionMatchSuggestions.teamId, params.teamId),
        eq(transactionMatchSuggestions.status, "pending"),
      ),
    )
    .leftJoin(
      // For inbox details in suggestions
      inbox,
      eq(inbox.id, transactionMatchSuggestions.inboxId),
    )
    .where(
      and(
        eq(transactions.id, params.id),
        eq(transactions.teamId, params.teamId),
      ),
    )
    .groupBy(
      transactions.id,
      users.id,
      transactionCategories.id,
      transactionCategories.name,
      transactionCategories.color,
      transactionCategories.slug,
      transactionCategories.taxRate,
      transactionCategories.taxType,
      bankAccounts.id,
      bankConnections.id,
      transactions.date,
      transactions.amount,
      transactions.currency,
      transactions.method,
      transactions.status,
      transactions.note,
      transactions.manual,
      transactions.internal,
      transactions.recurring,
      transactions.frequency,
      transactions.name,
      transactions.description,
      transactions.createdAt,
      transactionMatchSuggestions.id,
      transactionMatchSuggestions.inboxId,
      transactionMatchSuggestions.confidenceScore,
      inbox.displayName,
      inbox.amount,
      inbox.currency,
      inbox.filePath,
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

type GetSimilarTransactionsParams = {
  name: string;
  teamId: string;
  categorySlug?: string;
  frequency?: "weekly" | "monthly" | "annually" | "irregular";
  transactionId?: string; // Optional: if we want to exclude the source transaction
  limit?: number;
  minSimilarityScore?: number; // Alternative to limit: quality-based filtering
};

/**
 * Find similar transactions using hybrid search: combines embeddings AND FTS for comprehensive results
 *
 * @param db - Database connection
 * @param params - Search parameters including optional embedding settings
 * @returns Array of similar transactions, ordered by relevance (embedding matches first, then FTS matches)
 */
export async function getSimilarTransactions(
  db: Database,
  params: GetSimilarTransactionsParams,
) {
  const {
    name,
    teamId,
    categorySlug,
    frequency,
    transactionId,
    minSimilarityScore = 0.9,
  } = params;

  logger.info("Starting hybrid search for similar transactions", {
    name,
    teamId,
    minSimilarityScore,
    transactionId,
    categorySlug,
    frequency,
  });

  let embeddingResults: any[] = [];
  let ftsResults: any[] = [];
  let embeddingSourceText: string | null = null;

  // 1. EMBEDDING SEARCH (if transactionId provided)
  if (transactionId) {
    logger.info("Attempting embedding search", {
      transactionId,
      teamId,
    });

    try {
      const sourceEmbedding = await db
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

      if (sourceEmbedding.length > 0 && sourceEmbedding[0]!.embedding) {
        const sourceEmbeddingVector = sourceEmbedding[0]!.embedding;
        const sourceText = sourceEmbedding[0]!.sourceText;
        embeddingSourceText = sourceText; // Store for FTS search

        logger.info("Found embedding for transaction", {
          transactionId,
          sourceText,
          embeddingExists: true,
        });

        // Calculate similarity using cosineDistance function from Drizzle
        const similarity = sql<number>`1 - (${cosineDistance(transactionEmbeddings.embedding, sourceEmbeddingVector)})`;

        const embeddingConditions: (SQL | undefined)[] = [
          eq(transactions.teamId, teamId),
          ne(transactions.id, transactionId), // Exclude the source transaction
          gt(similarity, minSimilarityScore), // Use configurable similarity threshold
        ];

        if (categorySlug) {
          embeddingConditions.push(
            or(
              isNull(transactions.categorySlug),
              ne(transactions.categorySlug, categorySlug),
            ),
          );
        }

        // Note: We don't filter by frequency here because we want to find similar transactions
        // regardless of their current frequency so we can update them to the new frequency

        const finalEmbeddingConditions = embeddingConditions.filter(
          (c) => c !== undefined,
        ) as SQL[];

        embeddingResults = await db
          .select({
            id: transactions.id,
            amount: transactions.amount,
            teamId: transactions.teamId,
            name: transactions.name,
            date: transactions.date,
            categorySlug: transactions.categorySlug,
            frequency: transactions.frequency,
            similarity,
            source: sql<string>`'embedding'`.as("source"),
          })
          .from(transactions)
          .innerJoin(
            transactionEmbeddings,
            eq(transactionEmbeddings.transactionId, transactions.id),
          )
          .where(and(...finalEmbeddingConditions))
          .orderBy(desc(similarity)); // No limit - let similarity threshold determine results

        logger.info("Embedding search completed", {
          resultsFound: embeddingResults.length,
          minSimilarityScore,
          transactionId,
        });
      } else {
        logger.warn(
          "No embedding found for transaction - will rely on FTS only",
          {
            transactionId,
            teamId,
            transactionName: name,
          },
        );
      }
    } catch (error) {
      logger.error("Embedding search failed", {
        error: error instanceof Error ? error.message : String(error),
        transactionId,
        teamId,
      });
    }
  }

  // 2. FTS SEARCH (always run to complement embeddings)
  logger.info("Running FTS search", {
    name,
    teamId,
    hasEmbeddingResults: embeddingResults.length > 0,
    hasSourceEmbedding: !!embeddingSourceText,
  });

  const ftsConditions: (SQL | undefined)[] = [eq(transactions.teamId, teamId)];

  if (transactionId) {
    ftsConditions.push(ne(transactions.id, transactionId));
  }

  // Always use the original transaction name for FTS search to ensure we find exact matches
  // The embedding source text might be different from the actual transaction names
  const searchTerm = name;
  const searchQuery = buildSearchQuery(searchTerm);
  ftsConditions.push(
    sql`to_tsquery('english', ${searchQuery}) @@ ${transactions.ftsVector}`,
  );

  logger.info("FTS search using term", {
    searchTerm,
    searchQuery,
    usingEmbeddingSourceText: false, // Always false now - we use original name
    originalName: name,
    embeddingSourceText: embeddingSourceText || "none",
    reason: "Using original transaction name to find exact matches",
  });

  if (categorySlug) {
    ftsConditions.push(
      or(
        isNull(transactions.categorySlug),
        ne(transactions.categorySlug, categorySlug),
      ),
    );
  }

  // Exclude transactions already found by embeddings
  if (embeddingResults.length > 0) {
    const embeddingIds = embeddingResults.map((r) => r.id);
    ftsConditions.push(
      sql`${transactions.id} NOT IN (${sql.join(
        embeddingIds.map((id) => sql`${id}`),
        sql`, `,
      )})`,
    );
  }

  const finalFtsConditions = ftsConditions.filter(
    (c) => c !== undefined,
  ) as SQL[];

  logger.info("FTS search conditions", {
    searchTerm,
    searchQuery,
    conditionsCount: finalFtsConditions.length,
    teamId,
    transactionId,
    categorySlug,
    frequency,
  });

  ftsResults = await db
    .select({
      id: transactions.id,
      amount: transactions.amount,
      teamId: transactions.teamId,
      name: transactions.name,
      date: transactions.date,
      categorySlug: transactions.categorySlug,
      frequency: transactions.frequency,
      source: sql<string>`'fts'`.as("source"),
    })
    .from(transactions)
    .where(and(...finalFtsConditions)); // No limit - get all FTS matches

  logger.info("FTS search completed", {
    resultsFound: ftsResults.length,
    searchTerm,
    searchQuery,
    teamId,
    sampleResults: ftsResults.slice(0, 3).map((r) => ({
      name: r.name,
      id: r.id,
    })),
  });

  // 3. COMBINE AND DEDUPLICATE RESULTS
  const allResults = [
    ...embeddingResults.map(({ similarity, source, ...rest }) => ({
      ...rest,
      matchType: source,
    })),
    ...ftsResults.map(({ source, ...rest }) => ({
      ...rest,
      matchType: source,
    })),
  ];

  // Remove duplicates based on transaction ID (most accurate)
  // If same ID appears in both embedding and FTS results, prioritize embedding
  const uniqueResults = allResults.filter((transaction, index, array) => {
    return index === array.findIndex((t) => t.id === transaction.id);
  });

  // Log final results with structured data
  logger.info("Hybrid search completed", {
    totalResults: allResults.length,
    uniqueResults: uniqueResults.length,
    embeddingMatches: embeddingResults.length,
    ftsMatches: ftsResults.length,
    name,
    teamId,
    minSimilarityScore,
    results: uniqueResults.map((t, i) => ({
      rank: i + 1,
      name: t.name,
      matchType: t.matchType,
      id: t.id,
    })),
  });

  // Remove matchType field and return all quality matches
  return uniqueResults.map(({ matchType, ...rest }) => rest);
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
    const results = await db.executeOnReplica(
      sql`SELECT * FROM search_transactions_direct(
        ${teamId},
        ${query},
        ${maxResults}
      )`,
    );

    // Cast results to match the new type structure and filter if needed
    const processedResults = results.map((result: any) => ({
      ...result,
      is_already_matched: false,
      matched_attachment_filename: undefined,
    }));

    return processedResults;
  }

  if (inboxId) {
    try {
      // Implement the matching logic using Drizzle instead of stored procedure
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

      const item = inboxItem[0]!; // Safe to use non-null assertion since we checked length above

      // Find candidate transactions including those with attachments
      const candidateTransactions = await db
        .select({
          transactionId: transactions.id,
          name: transactions.name,
          transactionAmount: transactions.amount,
          transactionCurrency: transactions.currency,
          transactionDate: transactions.date,
          baseAmount: transactions.baseAmount,
          baseCurrency: transactions.baseCurrency,
          // Check if transaction is already matched (has attachments or completed status)
          isAlreadyMatched: sql<boolean>`
            (EXISTS (SELECT 1 FROM ${transactionAttachments} WHERE ${eq(transactionAttachments.transactionId, transactions.id)} AND ${eq(transactionAttachments.teamId, teamId)}) OR ${transactions.status} = 'completed')
          `.as("is_already_matched"),
          // Get the first attachment filename if it exists
          attachmentFilename: sql<string | null>`
            (SELECT ${transactionAttachments.name} FROM ${transactionAttachments} 
             WHERE ${eq(transactionAttachments.transactionId, transactions.id)} AND ${eq(transactionAttachments.teamId, teamId)} 
             LIMIT 1)
          `.as("attachment_filename"),
          // Use pg_trgm similarity for accurate name matching
          nameScore:
            sql<number>`similarity(${transactions.name}, ${item.displayName ?? ""})`.as(
              "name_score",
            ),
          // More flexible amount matching with currency conversion support
          amountScore: sql<number>`
            GREATEST(
              -- Direct currency match
              (CASE WHEN ${transactions.currency} = ${item.currency ?? ""} THEN
                (1 - LEAST(ABS(ABS(${transactions.amount}) - ${item.amount ?? 0}::DOUBLE PRECISION) / GREATEST(${item.amount ?? 1}::DOUBLE PRECISION, 1), 1))::DOUBLE PRECISION
               ELSE 0 END),
              -- Base currency match (if both have base currency data)
              (CASE WHEN ${transactions.baseCurrency} IS NOT NULL AND ${item.baseCurrency ?? ""} != '' AND ${transactions.baseCurrency} = ${item.baseCurrency ?? ""} THEN
                (1 - LEAST(ABS(ABS(${transactions.baseAmount}) - ${item.baseAmount ?? 0}::DOUBLE PRECISION) / GREATEST(${item.baseAmount ?? 1}::DOUBLE PRECISION, 1), 1))::DOUBLE PRECISION
               ELSE 0 END),
              -- Cross-currency fallback for common ratios
              (CASE WHEN ${transactions.currency} != ${item.currency ?? ""} THEN
                LEAST(
                  (1 - LEAST(ABS(ABS(${transactions.amount}) / 10.0 - ${item.amount ?? 0}::DOUBLE PRECISION) / GREATEST(${item.amount ?? 1}::DOUBLE PRECISION, 1), 1))::DOUBLE PRECISION * 0.4,
                  0.6
                )
               ELSE 0 END)
            )
          `.as("amount_score"),
          // Currency matching score - give partial credit for different currencies
          currencyScore: sql<number>`
            (CASE
              WHEN ${transactions.currency} = ${item.currency ?? ""} THEN 1.0
              WHEN ${transactions.baseCurrency} IS NOT NULL AND ${item.baseCurrency ?? ""} != '' AND ${transactions.baseCurrency} = ${item.baseCurrency ?? ""} THEN 0.8
              ELSE 0.3
            END)::DOUBLE PRECISION
          `.as("currency_score"),
          // Date proximity score (within 30 days gets full score, linear decay after)
          dateScore: sql<number>`
            (1 - LEAST(ABS(${transactions.date}::date - ${item.date}::date) / 30.0, 1))::DOUBLE PRECISION
          `.as("date_score"),
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.teamId, teamId),
            eq(transactions.status, "posted"),
            // Date range filter: within 90 days of inbox date
            sql`${transactions.date} BETWEEN ${item.date}::date - INTERVAL '90 days' AND ${item.date}::date + INTERVAL '90 days'`,
            // Conditionally exclude already matched transactions
            ...(includeAlreadyMatched
              ? []
              : [
                  sql`NOT (EXISTS (SELECT 1 FROM ${transactionAttachments} WHERE ${eq(transactionAttachments.transactionId, transactions.id)} AND ${eq(transactionAttachments.teamId, teamId)}) OR ${transactions.status} = 'completed')`,
                ]),
            // More lenient amount filtering: allow a wider range for cross-currency matching
            or(
              // Direct currency match with 20% tolerance
              and(
                eq(transactions.currency, item.currency ?? ""),
                sql`ABS(${transactions.amount}) BETWEEN ${(item.amount ?? 0) * 0.8}::DOUBLE PRECISION AND ${(item.amount ?? 0) * 1.2}::DOUBLE PRECISION`,
              ),
              // Base currency match with 20% tolerance (only if both have base currency)
              and(
                sql`${transactions.baseCurrency} IS NOT NULL`,
                sql`${item.baseCurrency ?? ""} != ''`,
                eq(transactions.baseCurrency, item.baseCurrency ?? ""),
                sql`ABS(${transactions.baseAmount}) BETWEEN ${(item.baseAmount ?? 0) * 0.8}::DOUBLE PRECISION AND ${(item.baseAmount ?? 0) * 1.2}::DOUBLE PRECISION`,
              ),
              // Cross-currency: allow 10:1 ratio for common conversions like SEK:USD
              sql`ABS(${transactions.amount}) BETWEEN ${(item.amount ?? 0) * 8}::DOUBLE PRECISION AND ${(item.amount ?? 0) * 12}::DOUBLE PRECISION`,
            ),
          ),
        );

      // Calculate confidence scores and filter results
      const scoredResults = candidateTransactions
        .map((transaction) => {
          const confidenceScore =
            transaction.nameScore * 0.4 + // Name similarity weight: 40% (slightly reduced)
            transaction.amountScore * 0.4 + // Amount match weight: 40% (increased importance)
            transaction.currencyScore * 0.1 + // Currency match weight: 10%
            transaction.dateScore * 0.1; // Date proximity weight: 10%

          const result = {
            transaction_id: transaction.transactionId,
            name: transaction.name,
            transaction_amount: transaction.transactionAmount,
            transaction_currency: transaction.transactionCurrency,
            transaction_date: transaction.transactionDate,
            name_score: Math.round(transaction.nameScore * 10) / 10,
            amount_score: Math.round(transaction.amountScore * 10) / 10,
            currency_score: Math.round(transaction.currencyScore * 10) / 10,
            date_score: Math.round(transaction.dateScore * 10) / 10,
            confidence_score: Math.round(confidenceScore * 10) / 10,
            is_already_matched: transaction.isAlreadyMatched,
            matched_attachment_filename:
              transaction.attachmentFilename ?? undefined,
          };

          return result;
        })
        .filter((result) => result.confidence_score >= minConfidenceScore)
        .sort((a, b) => {
          // Sort by confidence score first (highest first), then by match status (unmatched first)
          if (a.confidence_score !== b.confidence_score) {
            return b.confidence_score - a.confidence_score;
          }

          // If confidence scores are equal, prioritize unmatched transactions
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
      status: transactions.status,
      attachments: sql<
        Array<{
          id: string;
          name: string | null;
          path: string[] | null;
          type: string | null;
          size: number | null;
        }>
      >`COALESCE(json_agg(DISTINCT jsonb_build_object('id', ${transactionAttachments.id}, 'name', ${transactionAttachments.name}, 'path', ${transactionAttachments.path}, 'type', ${transactionAttachments.type}, 'size', ${transactionAttachments.size})) FILTER (WHERE ${transactionAttachments.id} IS NOT NULL), '[]'::json)`.as(
        "attachments",
      ),
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
      >`COALESCE(json_agg(DISTINCT jsonb_build_object('id', ${transactionTags.id}, 'tag', jsonb_build_object('id', ${tags.id}, 'name', ${tags.name}))) FILTER (WHERE ${transactionTags.id} IS NOT NULL), '[]'::json)`.as(
        "tags",
      ),
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
    .leftJoin(
      transactionTags,
      and(
        eq(transactionTags.transactionId, transactions.id),
        eq(transactionTags.teamId, teamId),
      ),
    )
    .leftJoin(
      tags,
      and(eq(tags.id, transactionTags.tagId), eq(tags.teamId, teamId)),
    )
    .leftJoin(
      transactionAttachments,
      and(
        eq(transactionAttachments.transactionId, transactions.id),
        eq(transactionAttachments.teamId, teamId),
      ),
    )
    .where(and(inArray(transactions.id, ids), eq(transactions.teamId, teamId)))
    .groupBy(
      transactions.id,
      transactionCategories.id,
      transactionCategories.name,
      transactionCategories.description,
      transactionCategories.taxRate,
      transactionCategories.taxType,
      transactionCategories.taxReportingCode,
      bankAccounts.id,
      bankAccounts.name,
    );

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
 * Used by import-transactions and update-account-base-currency processors
 */
export async function upsertTransactions(
  db: Database,
  params: UpsertTransactionsParams,
): Promise<Array<{ id: string }>> {
  const { transactions: transactionsData, teamId } = params;

  const upserted = await db
    .insert(transactions)
    .values(transactionsData)
    .onConflictDoUpdate({
      target: [transactions.internalId],
      set: {
        // Update all fields except id and createdAt
        name: sql`excluded.name`,
        amount: sql`excluded.amount`,
        currency: sql`excluded.currency`,
        date: sql`excluded.date`,
        description: sql`excluded.description`,
        method: sql`excluded.method`,
        status: sql`excluded.status`,
        balance: sql`excluded.balance`,
        note: sql`excluded.note`,
        categorySlug: sql`excluded.category_slug`,
        counterpartyName: sql`excluded.counterparty_name`,
        merchantName: sql`excluded.merchant_name`,
        bankAccountId: sql`excluded.bank_account_id`,
        assignedId: sql`excluded.assigned_id`,
        internal: sql`excluded.internal`,
        notified: sql`excluded.notified`,
        manual: sql`excluded.manual`,
        baseAmount: sql`excluded.base_amount`,
        baseCurrency: sql`excluded.base_currency`,
        taxAmount: sql`excluded.tax_amount`,
        taxRate: sql`excluded.tax_rate`,
        taxType: sql`excluded.tax_type`,
        recurring: sql`excluded.recurring`,
        frequency: sql`excluded.frequency`,
        enrichmentCompleted: sql`excluded.enrichment_completed`,
      },
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
 * Uses batch processing internally for large datasets
 */
export async function bulkUpdateTransactionsBaseCurrency(
  db: Database,
  params: BulkUpdateTransactionsBaseCurrencyParams,
) {
  const { transactions: transactionsData, teamId } = params;
  const BATCH_LIMIT = 500;

  // Process in batches
  for (let i = 0; i < transactionsData.length; i += BATCH_LIMIT) {
    const batch = transactionsData.slice(i, i + BATCH_LIMIT);

    // Get existing transactions to preserve all fields
    const transactionIds = batch.map((tx) => tx.id);
    const existingTransactions = await db
      .select()
      .from(transactions)
      .where(
        and(
          inArray(transactions.id, transactionIds),
          eq(transactions.teamId, teamId),
        ),
      );

    // Create upsert data preserving all existing fields, updating only baseAmount and baseCurrency
    const upsertData: UpsertTransactionData[] = existingTransactions.map(
      (tx) => {
        const update = batch.find((b) => b.id === tx.id);
        return {
          name: tx.name,
          date: tx.date,
          method: tx.method as "other" | "card_purchase" | "transfer",
          amount: Number(tx.amount),
          currency: tx.currency ?? "",
          teamId: tx.teamId,
          bankAccountId: tx.bankAccountId ?? null,
          internalId: tx.internalId ?? "",
          status: (tx.status ?? "posted") as
            | "pending"
            | "completed"
            | "archived"
            | "posted"
            | "excluded",
          manual: tx.manual ?? false,
          categorySlug: tx.categorySlug,
          description: tx.description,
          balance: tx.balance ? Number(tx.balance) : null,
          note: tx.note,
          counterpartyName: tx.counterpartyName,
          merchantName: tx.merchantName,
          assignedId: tx.assignedId,
          internal: tx.internal ?? false,
          notified: tx.notified ?? false,
          baseAmount:
            update?.baseAmount ??
            (tx.baseAmount ? Number(tx.baseAmount) : null),
          baseCurrency: update?.baseCurrency ?? tx.baseCurrency ?? null,
          taxAmount: tx.taxAmount ? Number(tx.taxAmount) : null,
          taxRate: tx.taxRate ? Number(tx.taxRate) : null,
          taxType: tx.taxType,
          recurring: tx.recurring ?? false,
          frequency: tx.frequency as
            | "weekly"
            | "biweekly"
            | "monthly"
            | "semi_monthly"
            | "annually"
            | "irregular"
            | "unknown"
            | null,
          enrichmentCompleted: tx.enrichmentCompleted ?? false,
        };
      },
    );

    await upsertTransactions(db, {
      transactions: upsertData,
      teamId,
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
): Promise<void> {
  if (transactionIds.length === 0) return;

  await db
    .update(transactions)
    .set({ status: "exported" })
    .where(inArray(transactions.id, transactionIds));
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
