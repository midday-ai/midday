import { and, eq, gte, inArray, notInArray, sql } from "drizzle-orm";
import type { Database } from "../client";
import {
  accountingSyncRecords,
  transactionAttachments,
  transactionCategories,
  transactions,
} from "../schema";

export type AccountingSyncRecord = {
  id: string;
  transactionId: string;
  teamId: string;
  provider: "xero" | "quickbooks" | "fortnox";
  providerTenantId: string;
  providerTransactionId: string | null;
  /** Maps Midday attachment IDs to provider attachment IDs */
  syncedAttachmentMapping: Record<string, string | null>;
  syncedAt: string;
  /** Sync type (always "manual" - auto-sync was removed) */
  syncType: "manual" | null;
  /** Status: synced (all done), partial (attachments failed), failed (transaction failed), pending */
  status: "synced" | "partial" | "failed" | "pending";
  errorMessage: string | null;
  /** Standardized error code for frontend handling */
  errorCode: string | null;
  providerEntityType: string | null;
  createdAt: string;
};

export type CreateAccountingSyncRecordParams = {
  transactionId: string;
  teamId: string;
  provider: "xero" | "quickbooks" | "fortnox";
  providerTenantId: string;
  providerTransactionId?: string;
  /** Maps Midday attachment IDs to provider attachment IDs */
  syncedAttachmentMapping?: Record<string, string | null>;
  /** Sync type (always "manual" - auto-sync was removed) */
  syncType?: "manual";
  /** Status: synced (all done), partial (attachments failed), failed (transaction failed), pending */
  status?: "synced" | "partial" | "failed" | "pending";
  errorMessage?: string;
  /** Standardized error code for frontend handling (e.g., "ATTACHMENT_UNSUPPORTED_TYPE", "AUTH_EXPIRED") */
  errorCode?: string;
  /** Provider-specific entity type (e.g., "Purchase", "SalesReceipt", "Voucher", "BankTransaction") */
  providerEntityType?: string;
};

/**
 * Create or update an accounting sync record
 */
export const upsertAccountingSyncRecord = async (
  db: Database,
  params: CreateAccountingSyncRecordParams,
) => {
  const status = params.status ?? "synced";
  // Clear error fields when status is synced (successful re-export should clear previous errors)
  const errorMessage =
    status === "synced" ? null : (params.errorMessage ?? null);
  const errorCode = status === "synced" ? null : (params.errorCode ?? null);

  const [result] = await db
    .insert(accountingSyncRecords)
    .values({
      transactionId: params.transactionId,
      teamId: params.teamId,
      provider: params.provider,
      providerTenantId: params.providerTenantId,
      providerTransactionId: params.providerTransactionId,
      syncedAttachmentMapping: params.syncedAttachmentMapping ?? {},
      syncType: params.syncType,
      status,
      errorMessage,
      errorCode,
      providerEntityType: params.providerEntityType,
    })
    .onConflictDoUpdate({
      target: [
        accountingSyncRecords.transactionId,
        accountingSyncRecords.provider,
      ],
      set: {
        providerTransactionId: params.providerTransactionId,
        syncedAttachmentMapping: params.syncedAttachmentMapping ?? {},
        syncedAt: new Date().toISOString(),
        syncType: params.syncType,
        status,
        errorMessage,
        errorCode,
        providerEntityType: params.providerEntityType,
      },
    })
    .returning();

  return result;
};

export type GetSyncedTransactionIdsParams = {
  teamId: string;
  provider: "xero" | "quickbooks" | "fortnox";
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
  provider?: "xero" | "quickbooks" | "fortnox";
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

export type GetUnsyncedTransactionsParams = {
  teamId: string;
  provider: "xero" | "quickbooks" | "fortnox";
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
  /** Category's tax reporting code - used for Xero account code mapping */
  categoryReportingCode: string | null;
  counterpartyName: string | null;
  status: string | null;
  /** Tax amount from OCR or manual entry */
  taxAmount: number | null;
  /** Tax rate percentage (e.g., 25 for 25%) */
  taxRate: number | null;
  /** Tax type (e.g., "VAT", "moms", "GST") */
  taxType: string | null;
  /** Category's tax rate (fallback if transaction doesn't have one) */
  categoryTaxRate: number | null;
  /** Category's tax type (fallback if transaction doesn't have one) */
  categoryTaxType: string | null;
  /** User's personal notes about the transaction */
  note: string | null;
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
  provider: "xero" | "quickbooks" | "fortnox";
  transactionIds?: string[];
  sinceDaysAgo?: number;
  limit?: number;
};

/**
 * Get transactions for accounting sync with attachments
 *
 * Only returns "fulfilled" transactions:
 * - Has attachments (from matching or manual upload) OR
 * - Status = 'completed' (user marked as done without attachment)
 *
 * Never syncs:
 * - Status = 'excluded' (user excluded from books)
 * - Status = 'archived' (old transactions)
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

  // Build base conditions
  const conditions = [
    eq(transactions.teamId, teamId),
    // Exclude 'excluded' and 'archived' transactions
    sql`${transactions.status} NOT IN ('excluded', 'archived')`,
  ];

  // If specific IDs provided, use those (for manual export)
  if (transactionIds && transactionIds.length > 0) {
    conditions.push(inArray(transactions.id, transactionIds));
  } else {
    // For auto-sync: exclude already synced transactions
    const syncedIds = await getSyncedTransactionIds(db, { teamId, provider });

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

  // Query with isFulfilled filter:
  // Transaction is fulfilled if it has attachments OR status = 'completed'
  const results = await db
    .select({
      id: transactions.id,
      date: transactions.date,
      name: transactions.name,
      description: transactions.description,
      amount: transactions.amount,
      currency: transactions.currency,
      categorySlug: transactions.categorySlug,
      categoryReportingCode: transactionCategories.taxReportingCode,
      counterpartyName: transactions.counterpartyName,
      status: transactions.status,
      taxAmount: transactions.taxAmount,
      taxRate: transactions.taxRate,
      taxType: transactions.taxType,
      categoryTaxRate: transactionCategories.taxRate,
      categoryTaxType: transactionCategories.taxType,
      note: transactions.note,
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
      transactionCategories,
      and(
        eq(transactions.categorySlug, transactionCategories.slug),
        eq(transactionCategories.teamId, teamId),
      ),
    )
    .leftJoin(
      transactionAttachments,
      and(
        eq(transactionAttachments.transactionId, transactions.id),
        eq(transactionAttachments.teamId, teamId),
      ),
    )
    .where(and(...conditions))
    .groupBy(
      transactions.id,
      transactionCategories.taxReportingCode,
      transactions.taxAmount,
      transactions.taxRate,
      transactions.taxType,
      transactionCategories.taxRate,
      transactionCategories.taxType,
      transactions.note,
    )
    // Filter to only fulfilled transactions:
    // Has at least one attachment OR status = 'completed'
    .having(
      sql`(
        COUNT(${transactionAttachments.id}) > 0
        OR ${transactions.status} = 'completed'
      )`,
    )
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

export type TransactionWithAttachmentChanges = {
  transactionId: string;
  providerTransactionId: string;
  syncRecordId: string;
  /** Maps Midday attachment IDs to provider attachment IDs */
  syncedAttachmentMapping: Record<string, string | null>;
  currentAttachments: Array<{
    id: string;
    name: string | null;
    path: string[] | null;
    type: string | null;
    size: number | null;
  }>;
  /** Attachment IDs that exist now but weren't synced before */
  newAttachmentIds: string[];
  /** Attachment IDs that were synced but no longer exist (with their provider IDs) */
  removedAttachments: Array<{ middayId: string; providerId: string | null }>;
};

export type GetSyncedTransactionsWithAttachmentChangesParams = {
  teamId: string;
  provider: "xero" | "quickbooks" | "fortnox";
  sinceDaysAgo?: number;
  limit?: number;
};

/**
 * Get synced transactions that have attachment changes (new or removed)
 *
 * This finds transactions where:
 * - Already synced to the provider (status = 'synced')
 * - Have new attachments that weren't synced before OR
 * - Have removed attachments that were previously synced
 *
 * Used to push attachment updates to already-synced transactions.
 *
 * Optimized: Single JOIN query instead of 2 separate queries
 */
export const getSyncedTransactionsWithAttachmentChanges = async (
  db: Database,
  params: GetSyncedTransactionsWithAttachmentChangesParams,
): Promise<TransactionWithAttachmentChanges[]> => {
  const { teamId, provider, sinceDaysAgo = 30, limit = 100 } = params;

  // Calculate the date threshold
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - sinceDaysAgo);
  const sinceDateStr = sinceDate.toISOString().split("T")[0]!;

  // Single JOIN query: sync_records + transactions + attachments
  const results = await db
    .select({
      syncRecordId: accountingSyncRecords.id,
      transactionId: accountingSyncRecords.transactionId,
      providerTransactionId: accountingSyncRecords.providerTransactionId,
      syncedAttachmentMapping: accountingSyncRecords.syncedAttachmentMapping,
      currentAttachments: sql<
        Array<{
          id: string;
          name: string | null;
          path: string[] | null;
          type: string | null;
          size: number | null;
        }>
      >`COALESCE(json_agg(DISTINCT jsonb_build_object(
        'id', ${transactionAttachments.id},
        'name', ${transactionAttachments.name},
        'path', ${transactionAttachments.path},
        'type', ${transactionAttachments.type},
        'size', ${transactionAttachments.size}
      )) FILTER (WHERE ${transactionAttachments.id} IS NOT NULL), '[]'::json)`.as(
        "currentAttachments",
      ),
    })
    .from(accountingSyncRecords)
    .innerJoin(
      transactions,
      and(
        eq(transactions.id, accountingSyncRecords.transactionId),
        eq(transactions.teamId, teamId),
        gte(transactions.date, sinceDateStr),
        sql`${transactions.status} NOT IN ('excluded', 'archived')`,
      ),
    )
    .leftJoin(
      transactionAttachments,
      and(
        eq(transactionAttachments.transactionId, transactions.id),
        eq(transactionAttachments.teamId, teamId),
      ),
    )
    .where(
      and(
        eq(accountingSyncRecords.teamId, teamId),
        eq(accountingSyncRecords.provider, provider),
        eq(accountingSyncRecords.status, "synced"),
        // Only include records that have a provider transaction ID
        sql`${accountingSyncRecords.providerTransactionId} IS NOT NULL`,
      ),
    )
    .groupBy(accountingSyncRecords.id)
    .limit(limit);

  // Filter and map to find transactions with attachment changes
  const result: TransactionWithAttachmentChanges[] = [];

  for (const row of results) {
    if (!row.providerTransactionId) continue;

    const syncedMapping = (row.syncedAttachmentMapping ?? {}) as Record<
      string,
      string | null
    >;
    const syncedIds = new Set(Object.keys(syncedMapping));
    const currentIds = new Set(row.currentAttachments?.map((a) => a.id) ?? []);

    // Find attachments that exist now but weren't synced before (NEW)
    const newAttachmentIds = [...currentIds].filter((id) => !syncedIds.has(id));

    // Find attachments that were synced but no longer exist (REMOVED)
    const removedAttachments = [...syncedIds]
      .filter((id) => !currentIds.has(id))
      .map((middayId) => ({
        middayId,
        providerId: syncedMapping[middayId] ?? null,
      }));

    // Only include if there are changes
    if (newAttachmentIds.length > 0 || removedAttachments.length > 0) {
      result.push({
        transactionId: row.transactionId,
        providerTransactionId: row.providerTransactionId,
        syncRecordId: row.syncRecordId,
        syncedAttachmentMapping: syncedMapping,
        currentAttachments: row.currentAttachments ?? [],
        newAttachmentIds,
        removedAttachments,
      });
    }
  }

  return result;
};

export type UpdateSyncedAttachmentMappingParams = {
  syncRecordId: string;
  /** Maps Midday attachment IDs to provider attachment IDs */
  syncedAttachmentMapping: Record<string, string | null>;
  /** Optional status update (e.g., 'partial' if some attachments failed) */
  status?: "synced" | "partial" | "failed";
  /** Optional error message for failed attachments */
  errorMessage?: string | null;
  /** Optional error code for frontend handling */
  errorCode?: string | null;
};

/**
 * Update the synced attachment mapping on a sync record
 * Can also update status to 'partial' if some attachments failed
 */
export const updateSyncedAttachmentMapping = async (
  db: Database,
  params: UpdateSyncedAttachmentMappingParams,
) => {
  const [result] = await db
    .update(accountingSyncRecords)
    .set({
      syncedAttachmentMapping: params.syncedAttachmentMapping,
      syncedAt: new Date().toISOString(),
      ...(params.status && { status: params.status }),
      ...(params.errorMessage !== undefined && {
        errorMessage: params.errorMessage,
      }),
      ...(params.errorCode !== undefined && {
        errorCode: params.errorCode,
      }),
    })
    .where(eq(accountingSyncRecords.id, params.syncRecordId))
    .returning();

  return result;
};
