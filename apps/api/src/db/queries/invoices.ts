import type { Database } from "@api/db";
import { customers, invoiceStatusEnum, invoices, teams } from "@api/db/schema";
import { buildSearchQuery } from "@api/utils/search";
import { and, asc, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm/sql/sql";

export type GetInvoicesParams = {
  teamId: string;
  cursor?: string | null;
  pageSize?: number;
  filter?: {
    q?: string | null;
    statuses?: string[] | null;
    customers?: string[] | null;
    start?: string | null;
    end?: string | null;
  };
  sort?: string[] | null;
};

export async function getInvoices(db: Database, params: GetInvoicesParams) {
  const { teamId, filter, sort, cursor, pageSize = 25 } = params;
  const { q, statuses, start, end, customers: customerIds } = filter || {};

  const whereConditions: SQL[] = [eq(invoices.teamId, teamId)];

  // Apply status filter
  if (statuses && statuses.length > 0) {
    // Cast the statuses array to the correct enum type
    const validStatuses = statuses.filter((status) =>
      invoiceStatusEnum.enumValues.includes(
        status as (typeof invoiceStatusEnum.enumValues)[number],
      ),
    ) as (typeof invoiceStatusEnum.enumValues)[number][];

    if (validStatuses.length > 0) {
      whereConditions.push(inArray(invoices.status, validStatuses));
    }
  }

  // Apply date range filter
  if (start && end) {
    whereConditions.push(gte(invoices.dueDate, start));
    whereConditions.push(lte(invoices.dueDate, end));
  }

  // Apply customer filter
  if (customerIds && customerIds.length > 0) {
    whereConditions.push(inArray(invoices.customerId, customerIds));
  }

  // Apply search query filter
  if (q) {
    // If the query is a number, search by amount
    if (!Number.isNaN(Number.parseInt(q))) {
      whereConditions.push(
        sql`${invoices.amount}::text = ${Number(q).toString()}`,
      );
    } else {
      const query = buildSearchQuery(q);

      // Search using full-text search or customerName
      whereConditions.push(
        sql`(to_tsquery('english', ${query}) @@ ${invoices.fts} OR ${invoices.customerName} ILIKE '%' || ${q} || '%')`,
      );
    }
  }

  // Start building the query
  const query = db
    .select({
      id: invoices.id,
      dueDate: invoices.dueDate,
      invoiceNumber: invoices.invoiceNumber,
      createdAt: invoices.createdAt,
      amount: invoices.amount,
      currency: invoices.currency,
      lineItems: invoices.lineItems,
      paymentDetails: invoices.paymentDetails,
      customerDetails: invoices.customerDetails,
      reminderSentAt: invoices.reminderSentAt,
      updatedAt: invoices.updatedAt,
      note: invoices.note,
      internalNote: invoices.internalNote,
      paidAt: invoices.paidAt,
      vat: invoices.vat,
      tax: invoices.tax,
      filePath: invoices.filePath,
      status: invoices.status,
      viewedAt: invoices.viewedAt,
      fromDetails: invoices.fromDetails,
      issueDate: invoices.issueDate,
      sentAt: invoices.sentAt,
      template: invoices.template,
      noteDetails: invoices.noteDetails,
      customerName: invoices.customerName,
      token: invoices.token,
      sentTo: invoices.sentTo,
      discount: invoices.discount,
      subtotal: invoices.subtotal,
      topBlock: invoices.topBlock,
      bottomBlock: invoices.bottomBlock,
      customer: {
        name: customers.name,
        website: customers.website,
        email: customers.email,
      },
      customerId: invoices.customerId,
      team: {
        name: teams.name,
      },
    })
    .from(invoices)
    .leftJoin(customers, eq(invoices.customerId, customers.id))
    .leftJoin(teams, eq(invoices.teamId, teams.id))
    .where(and(...whereConditions));

  // Apply sorting
  if (sort && sort.length === 2) {
    const [column, direction] = sort;
    const isAscending = direction === "asc";

    if (column === "customer") {
      isAscending
        ? query.orderBy(asc(customers.name))
        : query.orderBy(desc(customers.name));
    } else if (column === "created_at") {
      isAscending
        ? query.orderBy(asc(invoices.createdAt))
        : query.orderBy(desc(invoices.createdAt));
    } else if (column === "due_date") {
      isAscending
        ? query.orderBy(asc(invoices.dueDate))
        : query.orderBy(desc(invoices.dueDate));
    } else if (column === "amount") {
      isAscending
        ? query.orderBy(asc(invoices.amount))
        : query.orderBy(desc(invoices.amount));
    } else if (column === "status") {
      isAscending
        ? query.orderBy(asc(invoices.status))
        : query.orderBy(desc(invoices.status));
    }
  } else {
    // Default sort by created_at descending
    query.orderBy(desc(invoices.createdAt));
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
    data,
  };
}
