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
  pageSize?: number;
  filter?: {
    q?: string | null;
    statuses?: string[] | null;
    attachments?: "include" | "exclude" | null;
    categories?: string[] | null;
    tags?: string[] | null;
    type?: "expense" | "income" | null;
    accounts?: string[] | null;
    start?: string | null;
    end?: string | null;
    assignees?: string[] | null;
    recurring?: ("all" | TransactionFrequency)[] | null;
    amount?: ["gte" | "lte", number] | null;
    amount_range?: [number, number] | null;
  };
  sort?: string[] | null; // [column, "asc" | "desc"]
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
    whereConditions.push(lt(transactions.amount, "0"));
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
  if (filterAmountRange && filterAmountRange.length === 2) {
    whereConditions.push(
      gte(transactions.amount, filterAmountRange[0].toString()),
    );
    whereConditions.push(
      lte(transactions.amount, filterAmountRange[1].toString()),
    );
  }

  // Specific amount filter (gte/lte)
  if (filterAmount && filterAmount.length === 2) {
    const [operator, value] = filterAmount;
    if (operator === "gte") {
      whereConditions.push(gte(transactions.amount, value.toString()));
    } else if (operator === "lte") {
      whereConditions.push(lte(transactions.amount, value.toString()));
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
