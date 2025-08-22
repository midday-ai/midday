import type { Database } from "@db/client";
import {
  bankAccounts,
  bankConnections,
  inbox,
  tags,
  transactionAttachments,
  transactionCategories,
  type transactionFrequencyEnum,
  transactionTags,
  transactions,
  users,
} from "@db/schema";
import { buildSearchQuery } from "@midday/db/utils/search-query";
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
  or,
  sql,
} from "drizzle-orm";
import type { SQL } from "drizzle-orm/sql/sql";
import { nanoid } from "nanoid";
import { type Attachment, createAttachments } from "./transaction-attachments";

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
  amount_range?: number[] | null;
  amount?: string[] | null;
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
    amount_range: filterAmountRange,
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
    const endDate = new Date(end);
    endDate.setDate(endDate.getDate() + 1);
    const endDateString = endDate.toISOString().split("T")[0];
    if (endDateString) {
      whereConditions.push(lte(transactions.date, endDateString));
    }
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
  } else {
    // Default: pending, posted, or completed
    whereConditions.push(
      inArray(transactions.status, ["pending", "posted", "completed"]),
    );
  }

  // Categories filter
  if (filterCategories && filterCategories.length > 0) {
    const categoryConditions: (SQL | undefined)[] = [];
    for (const categorySlug of filterCategories) {
      if (categorySlug === "uncategorized") {
        categoryConditions.push(isNull(transactions.categorySlug));
      } else {
        categoryConditions.push(eq(transactions.categorySlug, categorySlug));
      }
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
    whereConditions.push(eq(transactions.categorySlug, "income"));
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

  // Amount range filter
  if (
    filterAmountRange &&
    filterAmountRange.length === 2 &&
    typeof filterAmountRange[0] === "number" &&
    typeof filterAmountRange[1] === "number"
  ) {
    whereConditions.push(
      gte(transactions.amount, Number(filterAmountRange[0])),
    );
    whereConditions.push(
      lte(transactions.amount, Number(filterAmountRange[1])),
    );
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
      enrichmentCompleted: transactions.enrichmentCompleted,
      isFulfilled:
        sql<boolean>`(EXISTS (SELECT 1 FROM ${transactionAttachments} WHERE ${eq(transactionAttachments.transactionId, transactions.id)} AND ${eq(transactionAttachments.teamId, teamId)}) OR ${transactions.status} = 'completed')`.as(
          "isFulfilled",
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

    const taxRate = rest.taxRate ?? rest.category?.taxRate ?? 0;

    return {
      ...rest,
      account: newAccount,
      taxRate,
      taxType: rest.taxType ?? rest.category?.taxType ?? null,
      taxAmount: Math.abs(
        +((taxRate * rest.amount) / (100 + taxRate)).toFixed(2),
      ),
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
      enrichmentCompleted: transactions.enrichmentCompleted,
      isFulfilled:
        sql<boolean>`(EXISTS (SELECT 1 FROM ${transactionAttachments} WHERE ${eq(transactionAttachments.transactionId, transactions.id)} AND ${eq(transactionAttachments.teamId, params.teamId)})) OR ${transactions.status} = 'completed'`.as(
          "isFulfilled",
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

  const taxRate = rest.taxRate ?? rest.category?.taxRate ?? 0;

  return {
    ...rest,
    account: newAccount,
    taxRate,
    taxType: rest.taxType ?? rest.category?.taxType ?? null,
    taxAmount: Math.abs(
      +((taxRate * rest.amount) / (100 + taxRate)).toFixed(2),
    ),
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

export async function getTransactionsAmountFullRangeData(
  db: Database,
  teamId: string,
) {
  return db.executeOnReplica(
    sql`select * from get_transactions_amount_full_range_data(${teamId})`,
  );
}

type GetSimilarTransactionsParams = {
  name: string;
  teamId: string;
  categorySlug?: string;
  frequency?: "weekly" | "monthly" | "annually" | "irregular";
};

export async function getSimilarTransactions(
  db: Database,
  params: GetSimilarTransactionsParams,
) {
  const { name, teamId, categorySlug, frequency } = params;

  const conditions: (SQL | undefined)[] = [eq(transactions.teamId, teamId)];

  const searchQuery = buildSearchQuery(name);
  conditions.push(
    sql`to_tsquery('english', ${searchQuery}) @@ ${transactions.ftsVector}`,
  );

  if (categorySlug) {
    conditions.push(ne(transactions.categorySlug, categorySlug));
  }

  if (frequency) {
    conditions.push(
      eq(transactions.frequency, frequency as TransactionFrequency),
    );
  }

  const finalConditions = conditions.filter((c) => c !== undefined) as SQL[];

  return db
    .select({
      id: transactions.id,
      amount: transactions.amount,
      teamId: transactions.teamId,
      name: transactions.name,
      date: transactions.date,
      categorySlug: transactions.categorySlug,
      frequency: transactions.frequency,
    })
    .from(transactions)
    .where(and(...finalConditions));
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
          date: sql<string>`COALESCE(${inbox.date}, ${inbox.createdAt}::date)`.as(
            "inbox_date",
          ),
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

type UpdateSimilarTransactionsCategoryParams = {
  teamId: string;
  name: string;
  categorySlug?: string | null;
  frequency?: "weekly" | "monthly" | "annually" | "irregular";
  recurring?: boolean;
};

export async function updateSimilarTransactionsCategory(
  db: Database,
  params: UpdateSimilarTransactionsCategoryParams,
) {
  const { name, teamId, categorySlug, frequency, recurring } = params;

  const updateData: Partial<{
    categorySlug: string | null;
    recurring: boolean;
    frequency: TransactionFrequency | null;
  }> = {};

  if (categorySlug !== undefined) {
    updateData.categorySlug = categorySlug;
  }

  if (recurring !== undefined) {
    updateData.recurring = recurring;
  }

  if (frequency !== undefined) {
    updateData.frequency = frequency as TransactionFrequency;
  }

  const searchQuery = buildSearchQuery(name);

  const results = await db
    .update(transactions)
    .set(updateData)
    .where(
      and(
        eq(transactions.teamId, teamId),
        sql`to_tsquery('english', ${searchQuery}) @@ ${transactions.ftsVector}`,
      ),
    )
    .returning({
      id: transactions.id,
    });

  // Get full transaction data for each updated transaction
  const fullTransactions = await Promise.all(
    results.map((result) => getFullTransactionData(db, result.id, teamId)),
  );

  // Filter out any null results
  return fullTransactions.filter((transaction) => transaction !== null);
}

type UpdateSimilarTransactionsRecurringParams = {
  id: string;
  teamId: string;
};

export async function updateSimilarTransactionsRecurring(
  db: Database,
  params: UpdateSimilarTransactionsRecurringParams,
) {
  const { id, teamId } = params;

  const [result] = await db
    .select({
      name: transactions.name,
      recurring: transactions.recurring,
      frequency: transactions.frequency,
    })
    .from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.teamId, teamId)))
    .limit(1);

  if (!result) {
    return [];
  }

  const { name, recurring, frequency } = result;

  const searchQuery = buildSearchQuery(name);

  const results = await db
    .update(transactions)
    .set({
      recurring: recurring,
      frequency: frequency,
    })
    .where(
      and(
        eq(transactions.teamId, teamId),
        sql`to_tsquery('english', ${searchQuery}) @@ ${transactions.ftsVector}`,
        ne(transactions.id, id),
      ),
    )
    .returning({
      id: transactions.id,
    });

  // Get full transaction data for each updated transaction
  const fullTransactions = await Promise.all(
    results.map((result) => getFullTransactionData(db, result.id, teamId)),
  );

  // Filter out any null results
  return fullTransactions.filter((transaction) => transaction !== null);
}

type UpdateTransactionData = {
  id: string;
  teamId: string;
  categorySlug?: string | null;
  status?: "pending" | "archived" | "completed" | "posted" | "excluded" | null;
  internal?: boolean;
  note?: string | null;
  assignedId?: string | null;
  recurring?: boolean;
  frequency?: "weekly" | "monthly" | "annually" | "irregular" | null;
};

export async function updateTransaction(
  db: Database,
  params: UpdateTransactionData,
) {
  const { id, teamId, ...dataToUpdate } = params;

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

  return getFullTransactionData(db, result.id, teamId);
}

type UpdateTransactionsData = {
  ids: string[];
  teamId: string;
  categorySlug?: string | null;
  status?: "pending" | "archived" | "completed" | "posted" | "excluded" | null;
  internal?: boolean;
  note?: string | null;
  assignedId?: string | null;
  tagId?: string | null;
  recurring?: boolean;
  frequency?: "weekly" | "monthly" | "annually" | "irregular" | null;
};

export async function updateTransactions(
  db: Database,
  data: UpdateTransactionsData,
) {
  const { ids, tagId, teamId, ...input } = data;

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
