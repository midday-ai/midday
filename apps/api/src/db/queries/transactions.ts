import type { Database } from "@api/db";
import {
  bankAccounts,
  bankConnections,
  tags,
  transactionAttachments,
  transactionCategories,
  type transactionFrequencyEnum,
  transactionStatusEnum,
  transactionTags,
  transactions,
  users,
} from "@api/db/schema";
import { buildSearchQuery } from "@api/utils/search";
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

export type GetTransactionsParams = {
  teamId: string;
  cursor?: string | null;
  sort?: string[] | null;
  pageSize?: number;
  filter?: {
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
};

// Helper type from schema if not already exported
type TransactionFrequency =
  (typeof transactionFrequencyEnum.enumValues)[number];
type TransactionStatus = (typeof transactionStatusEnum.enumValues)[number];

export async function getTransactions(
  db: Database,
  params: GetTransactionsParams,
) {
  // Always limit by teamId
  const { teamId, filter, sort, cursor, pageSize = 40 } = params;
  const {
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
  } = filter || {};

  // CTE to determine if a transaction has attachments for the given teamId
  const transactionAttachmentStatus = db.$with("tas").as(
    db
      .selectDistinct({
        transactionId: transactionAttachments.transactionId,
        has_attachment_val: sql<number>`1`.as("has_attachment_val"),
      })
      .from(transactionAttachments)
      .where(eq(transactionAttachments.teamId, teamId)),
  );

  // CTE to determine if a transaction has any tags for the given teamId
  const transactionTagStatus = db.$with("tts").as(
    db
      .selectDistinct({
        transactionId: transactionTags.transactionId,
        has_tag_val: sql<number>`1`.as("has_tag_val"),
      })
      .from(transactionTags)
      .where(eq(transactionTags.teamId, teamId)),
  );

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

  // Attachments filter using the 'tas' CTE
  if (attachments === "exclude") {
    whereConditions.push(sql`tas.has_attachment_val IS NULL`);
  } else if (attachments === "include") {
    whereConditions.push(sql`COALESCE(tas.has_attachment_val, 0) = 1`);
  }

  // Status filtering logic revised
  const activeStatusesToFilter: TransactionStatus[] = [];
  let isArchivedFiltered = false;
  let isExcludedFiltered = false;

  if (statuses && statuses.length > 0) {
    if (statuses.includes("excluded")) {
      whereConditions.push(eq(transactions.internal, true));
      isExcludedFiltered = true;
    }
    if (statuses.includes("archived")) {
      whereConditions.push(eq(transactions.status, "archived"));
      isArchivedFiltered = true;
    }
    for (const s of statuses) {
      if (s === "pending" || s === "posted" || s === "completed") {
        if (transactionStatusEnum.enumValues.includes(s as TransactionStatus)) {
          activeStatusesToFilter.push(s as TransactionStatus);
        }
      }
    }
  }

  if (activeStatusesToFilter.length > 0) {
    whereConditions.push(inArray(transactions.status, activeStatusesToFilter));
  } else if (!isArchivedFiltered && !isExcludedFiltered) {
    // Default to pending, posted, completed if no other status filter is applied
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
    whereConditions.push(inArray(transactions.bankAccountId, filterAccounts));
  }

  // Assignees filter
  if (filterAssignees && filterAssignees.length > 0) {
    whereConditions.push(inArray(transactions.assignedId, filterAssignees));
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
    .with(transactionAttachmentStatus, transactionTagStatus) // Add both CTEs
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
      frequency: transactions.frequency,
      name: transactions.name,
      description: transactions.description,
      createdAt: transactions.createdAt,
      isFulfilled:
        sql<boolean>`COALESCE(tas.has_attachment_val, 0) = 1 OR ${transactions.status} = 'completed'`.as(
          "isFulfilled",
        ),
      assigned: {
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        avatarUrl: users.avatarUrl,
      },
      category: {
        id: transactionCategories.id,
        name: transactionCategories.name,
        color: transactionCategories.color,
        slug: transactionCategories.slug,
      },
      bankAccount: {
        id: bankAccounts.id,
        name: bankAccounts.name,
        currency: bankAccounts.currency,
      },
      bankConnection: {
        id: bankConnections.id,
        logoUrl: bankConnections.logoUrl,
      },
      transactionTags: sql<
        Array<{ id: string; name: string | null }>
      >`COALESCE(json_agg(DISTINCT jsonb_build_object('id', ${tags.id}, 'name', ${tags.name})) FILTER (WHERE ${tags.id} IS NOT NULL), '[]'::json)`.as(
        "transactionTags",
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
      transactionAttachmentStatus,
      eq(transactions.id, transactionAttachmentStatus.transactionId),
    )
    .leftJoin(
      transactionTagStatus,
      eq(transactions.id, transactionTagStatus.transactionId),
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
      bankAccounts.id,
      bankAccounts.name,
      bankAccounts.currency,
      bankConnections.id,
      bankConnections.logoUrl,
      transactionAttachmentStatus.has_attachment_val,
      transactionTagStatus.has_tag_val,
    );

  let query = queryBuilder.$dynamic();

  // Sorting
  if (sort && sort.length === 2) {
    const [column, direction] = sort;
    const isAscending = direction === "asc";
    const order = isAscending ? asc : desc;

    if (column === "attachment") {
      // Use the same logic as isFulfilled, referencing the CTE's aliased column
      query = query.orderBy(
        order(
          sql`COALESCE(tas.has_attachment_val, 0) = 1 OR ${transactions.status} = 'completed'`,
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
      // Use the tts CTE for sorting by tags
      query = query.orderBy(
        order(sql`COALESCE(tts.has_tag_val, 0)`),
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
    const { bankAccount, bankConnection, ...rest } = row;

    const newBankAccount = {
      ...bankAccount,
      bankConnection: bankConnection?.id
        ? { id: bankConnection.id, logoUrl: bankConnection.logoUrl }
        : null,
    };

    return {
      ...rest,
      bankAccount: newBankAccount,
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

export async function getTransactionById(db: Database, transactionId: string) {
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
      frequency: transactions.frequency,
      name: transactions.name,
      description: transactions.description,
      createdAt: transactions.createdAt,
      isFulfilled:
        sql<boolean>`(EXISTS (SELECT 1 FROM ${transactionAttachments} WHERE ${eq(transactionAttachments.transactionId, transactions.id)})) OR ${transactions.status} = 'completed'`.as(
          "isFulfilled",
        ),
      assigned: {
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        avatarUrl: users.avatarUrl,
      },
      category: {
        id: transactionCategories.id,
        name: transactionCategories.name,
        color: transactionCategories.color,
        slug: transactionCategories.slug,
      },
      bankAccount: {
        id: bankAccounts.id,
        name: bankAccounts.name,
        currency: bankAccounts.currency,
      },
      bankConnection: {
        id: bankConnections.id,
        logoUrl: bankConnections.logoUrl,
      },
      transactionTags: sql<
        Array<{ id: string; name: string | null }>
      >`COALESCE(json_agg(DISTINCT jsonb_build_object('id', ${tags.id}, 'name', ${tags.name})) FILTER (WHERE ${tags.id} IS NOT NULL), '[]'::json)`.as(
        "transactionTags",
      ),
      attachments: sql<
        Array<{ id: string; filename: string | null; url: string | null }>
      >`COALESCE(json_agg(DISTINCT jsonb_build_object('id', ${transactionAttachments.id}, 'filename', ${transactionAttachments.name}, 'url', ${transactionAttachments.path})) FILTER (WHERE ${transactionAttachments.id} IS NOT NULL), '[]'::json)`.as(
        "attachments",
      ),
    })
    .from(transactions)
    .leftJoin(users, eq(transactions.assignedId, users.id))
    .leftJoin(
      transactionCategories,
      eq(transactions.categorySlug, transactionCategories.slug),
    )
    .leftJoin(bankAccounts, eq(transactions.bankAccountId, bankAccounts.id))
    .leftJoin(
      bankConnections,
      eq(bankAccounts.bankConnectionId, bankConnections.id),
    )
    .leftJoin(
      // For transactionTags aggregation
      transactionTags,
      eq(transactionTags.transactionId, transactions.id),
    )
    .leftJoin(
      // For transactionTags aggregation
      tags,
      eq(tags.id, transactionTags.tagId),
    )
    .leftJoin(
      // For attachments aggregation
      transactionAttachments,
      eq(transactionAttachments.transactionId, transactions.id),
    )
    .where(eq(transactions.id, transactionId))
    .groupBy(
      transactions.id,
      users.id,
      transactionCategories.id,
      bankAccounts.id,
      bankConnections.id,
      // transactionAttachmentStatus.has_attachment_val, // from removed CTE
      // Add all other non-aggregated selected columns from transactions table to GROUP BY
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

  const { bankAccount, bankConnection, ...rest } = result;

  const newBankAccount = bankAccount?.id
    ? {
        ...bankAccount,
        bankConnection: bankConnection?.id
          ? { id: bankConnection.id, logoUrl: bankConnection.logoUrl }
          : null,
      }
    : null;

  return {
    ...rest,
    bankAccount: newBankAccount,
  };
}

type DeleteTransactionsParams = {
  ids: string[];
};

export async function deleteTransactions(
  db: Database,
  params: DeleteTransactionsParams,
) {
  return db
    .delete(transactions)
    .where(
      and(inArray(transactions.id, params.ids), eq(transactions.manual, true)),
    )
    .returning();
}

export async function getTransactionsAmountFullRangeData(
  db: Database,
  teamId: string,
) {
  return db.execute(
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
  } = params;

  if (query) {
    return db.execute(
      sql`SELECT * FROM search_transactions_direct(
        ${teamId},
        ${query},
        ${maxResults}
      )`,
    );
  }

  if (inboxId) {
    return db.execute(
      sql`SELECT * FROM match_transactions_to_inbox(
        ${teamId},
        ${inboxId},
        ${maxResults},
        ${minConfidenceScore}
      )`,
    );
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

  return db
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
      teamId: transactions.teamId,
    });
}

type UpdateSimilarTransactionsRecurringParams = {
  id: string;
  team_id: string;
};

export async function updateSimilarTransactionsRecurring(
  db: Database,
  params: UpdateSimilarTransactionsRecurringParams,
) {
  const { id, team_id } = params;

  const [result] = await db
    .select({
      name: transactions.name,
      recurring: transactions.recurring,
      frequency: transactions.frequency,
    })
    .from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.teamId, team_id)))
    .limit(1);

  if (!result) {
    return [];
  }

  const { name, recurring, frequency } = result;

  const searchQuery = buildSearchQuery(name);

  return db
    .update(transactions)
    .set({
      recurring: recurring,
      frequency: frequency,
    })
    .where(
      and(
        eq(transactions.teamId, team_id),
        sql`to_tsquery('english', ${searchQuery}) @@ ${transactions.ftsVector}`,
        ne(transactions.id, id),
      ),
    )
    .returning({
      id: transactions.id,
      teamId: transactions.teamId,
    });
}
