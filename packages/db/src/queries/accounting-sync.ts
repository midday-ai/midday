import type { Database } from "@db/client";
import {
  accountingSyncRecords,
  bankAccounts,
  transactionAttachments,
  transactionCategories,
  transactions,
} from "@db/schema";
import { and, eq, gte, inArray, notInArray, sql } from "drizzle-orm";

export type AccountingSyncRecord = {
  id: string;
  transactionId: string;
  teamId: string;
  provider: "xero" | "quickbooks" | "fortnox" | "visma";
  providerTenantId: string;
  providerTransactionId: string | null;
  providerAttachmentId: string | null;
  syncedAt: string;
  syncType: "auto" | "manual" | null;
  status: "synced" | "failed" | "pending";
  errorMessage: string | null;
};

export type CreateAccountingSyncRecordParams = {
  transactionId: string;
  teamId: string;
  provider: "xero" | "quickbooks" | "fortnox" | "visma";
  providerTenantId: string;
  providerTransactionId?: string;
  providerAttachmentId?: string;
  syncType?: "auto" | "manual";
  status?: "synced" | "failed" | "pending";
  errorMessage?: string;
};

/**
 * Create or update an accounting sync record
 */
export const upsertAccountingSyncRecord = async (
  db: Database,
  params: CreateAccountingSyncRecordParams,
) => {
  const [result] = await db
    .insert(accountingSyncRecords)
    .values({
      transactionId: params.transactionId,
      teamId: params.teamId,
      provider: params.provider,
      providerTenantId: params.providerTenantId,
      providerTransactionId: params.providerTransactionId,
      providerAttachmentId: params.providerAttachmentId,
      syncType: params.syncType,
      status: params.status ?? "synced",
      errorMessage: params.errorMessage,
    })
    .onConflictDoUpdate({
      target: [
        accountingSyncRecords.transactionId,
        accountingSyncRecords.provider,
      ],
      set: {
        providerTransactionId: params.providerTransactionId,
        providerAttachmentId: params.providerAttachmentId,
        syncedAt: new Date().toISOString(),
        syncType: params.syncType,
        status: params.status ?? "synced",
        errorMessage: params.errorMessage,
      },
    })
    .returning();

  return result;
};

export type GetSyncedTransactionIdsParams = {
  teamId: string;
  provider: "xero" | "quickbooks" | "fortnox" | "visma";
};

/**
 * Get transaction IDs that have been synced to a provider
 */
export const getSyncedTransactionIds = async (
  db: Database,
  params: GetSyncedTransactionIdsParams,
): Promise<string[]> => {
  const results = await db
    .select({ transactionId: accountingSyncRecords.transactionId })
    .from(accountingSyncRecords)
    .where(
      and(
        eq(accountingSyncRecords.teamId, params.teamId),
        eq(accountingSyncRecords.provider, params.provider),
        eq(accountingSyncRecords.status, "synced"),
      ),
    );

  return results.map((r) => r.transactionId);
};

export type GetSyncStatusParams = {
  teamId: string;
  transactionIds?: string[];
  provider?: "xero" | "quickbooks" | "fortnox" | "visma";
};

/**
 * Get sync status for transactions
 */
export const getAccountingSyncStatus = async (
  db: Database,
  params: GetSyncStatusParams,
) => {
  const conditions = [eq(accountingSyncRecords.teamId, params.teamId)];

  if (params.transactionIds && params.transactionIds.length > 0) {
    conditions.push(
      inArray(accountingSyncRecords.transactionId, params.transactionIds),
    );
  }

  if (params.provider) {
    conditions.push(eq(accountingSyncRecords.provider, params.provider));
  }

  const results = await db
    .select()
    .from(accountingSyncRecords)
    .where(and(...conditions));

  return results;
};

export type UpdateSyncRecordAttachmentParams = {
  transactionId: string;
  teamId: string;
  provider: "xero" | "quickbooks" | "fortnox" | "visma";
  providerAttachmentId: string;
};

/**
 * Update attachment ID on a sync record
 */
export const updateAccountingSyncAttachment = async (
  db: Database,
  params: UpdateSyncRecordAttachmentParams,
) => {
  const [result] = await db
    .update(accountingSyncRecords)
    .set({
      providerAttachmentId: params.providerAttachmentId,
    })
    .where(
      and(
        eq(accountingSyncRecords.transactionId, params.transactionId),
        eq(accountingSyncRecords.teamId, params.teamId),
        eq(accountingSyncRecords.provider, params.provider),
      ),
    )
    .returning();

  return result;
};

export type GetUnsyncedTransactionsParams = {
  teamId: string;
  provider: "xero" | "quickbooks" | "fortnox" | "visma";
  transactionIds?: string[];
  limit?: number;
};

/**
 * Get transactions that haven't been synced to a specific provider
 * Returns transaction IDs that are NOT in accounting_sync_records with status 'synced'
 */
export const getUnsyncedTransactionIds = async (
  db: Database,
  params: GetUnsyncedTransactionsParams,
  allTransactionIds: string[],
): Promise<string[]> => {
  if (allTransactionIds.length === 0) return [];

  const syncedIds = await getSyncedTransactionIds(db, {
    teamId: params.teamId,
    provider: params.provider,
  });

  const syncedSet = new Set(syncedIds);
  return allTransactionIds.filter((id) => !syncedSet.has(id));
};

export type TransactionForSync = {
  id: string;
  date: string;
  name: string;
  description: string | null;
  amount: number;
  currency: string;
  categorySlug: string | null;
  attachments: Array<{
    id: string;
    name: string | null;
    path: string[] | null;
    type: string | null;
    size: number | null;
  }>;
};

export type GetTransactionsForAccountingSyncParams = {
  teamId: string;
  provider: "xero" | "quickbooks" | "fortnox" | "visma";
  transactionIds?: string[];
  sinceDaysAgo?: number;
  limit?: number;
};

/**
 * Get transactions for accounting sync with attachments
 * Excludes transactions already synced to the provider
 */
export const getTransactionsForAccountingSync = async (
  db: Database,
  params: GetTransactionsForAccountingSyncParams,
): Promise<TransactionForSync[]> => {
  const {
    teamId,
    provider,
    transactionIds,
    sinceDaysAgo = 30,
    limit = 500,
  } = params;

  // Build conditions
  const conditions = [
    eq(transactions.teamId, teamId),
    sql`${transactions.status} != 'excluded'`,
  ];

  // If specific IDs provided, use those
  if (transactionIds && transactionIds.length > 0) {
    conditions.push(inArray(transactions.id, transactionIds));
  } else {
    // Get synced transaction IDs for this provider
    const syncedIds = await getSyncedTransactionIds(db, { teamId, provider });

    // Exclude already synced transactions
    if (syncedIds.length > 0) {
      conditions.push(notInArray(transactions.id, syncedIds));
    }

    // Limit to recent transactions
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - sinceDaysAgo);
    conditions.push(
      gte(transactions.date, sinceDate.toISOString().split("T")[0]!),
    );
  }

  const results = await db
    .select({
      id: transactions.id,
      date: transactions.date,
      name: transactions.name,
      description: transactions.description,
      amount: transactions.amount,
      currency: transactions.currency,
      categorySlug: transactions.categorySlug,
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
    })
    .from(transactions)
    .leftJoin(
      transactionAttachments,
      and(
        eq(transactionAttachments.transactionId, transactions.id),
        eq(transactionAttachments.teamId, teamId),
      ),
    )
    .where(and(...conditions))
    .groupBy(transactions.id)
    .orderBy(sql`${transactions.date} DESC`)
    .limit(limit);

  return results;
};

export type GetTransactionAttachmentsParams = {
  teamId: string;
  attachmentIds: string[];
};

/**
 * Get transaction attachment details by IDs
 */
export const getTransactionAttachmentsForSync = async (
  db: Database,
  params: GetTransactionAttachmentsParams,
) => {
  const { teamId, attachmentIds } = params;

  if (attachmentIds.length === 0) return [];

  const results = await db
    .select({
      id: transactionAttachments.id,
      name: transactionAttachments.name,
      path: transactionAttachments.path,
      type: transactionAttachments.type,
      size: transactionAttachments.size,
    })
    .from(transactionAttachments)
    .where(
      and(
        eq(transactionAttachments.teamId, teamId),
        inArray(transactionAttachments.id, attachmentIds),
      ),
    );

  return results;
};
