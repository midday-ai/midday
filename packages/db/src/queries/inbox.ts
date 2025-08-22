import type { Database } from "@db/client";
import {
  inbox,
  inboxAccounts,
  transactionAttachments,
  transactions,
} from "@db/schema";
import { buildSearchQuery } from "@midday/db/utils/search-query";
import { and, asc, desc, eq, ne, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm/sql/sql";

export type GetInboxParams = {
  teamId: string;
  cursor?: string | null;
  order?: string | null;
  pageSize?: number;
  q?: string | null;
  status?: "new" | "archived" | "processing" | "done" | "pending" | null;
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
    })
    .from(inbox)
    .leftJoin(transactions, eq(inbox.transactionId, transactions.id))
    .leftJoin(inboxAccounts, eq(inbox.inboxAccountId, inboxAccounts.id))
    .where(and(eq(inbox.id, id), eq(inbox.teamId, teamId)))
    .limit(1);

  return result;
}

export type DeleteInboxParams = {
  id: string;
  teamId: string;
};

export async function deleteInbox(db: Database, params: DeleteInboxParams) {
  const { id, teamId } = params;
  return db
    .update(inbox)
    .set({ status: "deleted" })
    .where(and(eq(inbox.id, id), eq(inbox.teamId, teamId)))
    .returning();
}

export type GetInboxSearchParams = {
  teamId: string;
  limit?: number;
  q: string | number;
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

  // Apply search query filter
  if (!Number.isNaN(Number.parseInt(String(q)))) {
    // If the query is a number, search by amount
    whereConditions.push(
      sql`${inbox.amount}::text LIKE '%' || ${String(q)} || '%'`,
    );
  } else {
    // Search using full-text search
    const query = buildSearchQuery(String(q));
    whereConditions.push(sql`to_tsquery('english', ${query}) @@ ${inbox.fts}`);
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
    .orderBy(asc(inbox.createdAt))
    .limit(limit);

  return data;
}

export type UpdateInboxParams = {
  id: string;
  teamId: string;
  status?: "deleted" | "new" | "archived" | "processing" | "done" | "pending";
};

export async function updateInbox(db: Database, params: UpdateInboxParams) {
  const { id, teamId, ...data } = params;

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

export type UnmatchTransactionParams = {
  id: string;
  teamId: string;
};

export async function unmatchTransaction(
  db: Database,
  params: UnmatchTransactionParams,
) {
  const { id, teamId } = params;

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
    })
    .from(inbox)
    .where(and(eq(inbox.filePath, filePath), eq(inbox.teamId, teamId)))
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
