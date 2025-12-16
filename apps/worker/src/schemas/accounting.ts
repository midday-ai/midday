import { z } from "zod";

/**
 * Supported provider IDs (currently implemented)
 */
export const accountingProviderIdSchema = z.enum([
  "xero",
  "quickbooks",
  "fortnox",
]);

/**
 * Schema for sync-accounting-transactions job
 */
export const accountingSyncSchema = z.object({
  teamId: z.string().uuid(),
  providerId: accountingProviderIdSchema,
  transactionIds: z.array(z.string().uuid()).optional(), // All unsynced if not provided
  includeAttachments: z.boolean().default(true),
  manualSync: z.boolean().default(false),
});

export type AccountingSyncPayload = z.infer<typeof accountingSyncSchema>;

/**
 * Provider entity types
 * Used to link attachments to the correct entity without an extra API call
 */
export const providerEntityTypeSchema = z.enum([
  "Purchase", // QuickBooks expense
  "SalesReceipt", // QuickBooks income
  "BankTransaction", // Xero bank transaction
  "Voucher", // Fortnox voucher (verifikation)
]);

export type ProviderEntityType = z.infer<typeof providerEntityTypeSchema>;

/**
 * Schema for sync-accounting-attachments job
 */
export const accountingAttachmentSyncSchema = z.object({
  teamId: z.string().uuid(),
  providerId: accountingProviderIdSchema,
  syncRecordId: z.string().uuid().optional(), // The accounting_sync_record ID (for updates)
  transactionId: z.string().uuid(), // Midday transaction ID
  providerTransactionId: z.string(), // External provider transaction ID
  attachmentIds: z.array(z.string().uuid()), // Midday attachment IDs to upload
  // For attachment updates: IDs already synced, so we can build the full list
  existingSyncedAttachmentIds: z.array(z.string().uuid()).optional(),
  // Entity type for QuickBooks - avoids extra API call to determine Purchase vs SalesReceipt
  providerEntityType: providerEntityTypeSchema.optional(),
});

export type AccountingAttachmentSyncPayload = z.infer<
  typeof accountingAttachmentSyncSchema
>;

/**
 * Schema for export-to-accounting job (manual export)
 */
export const accountingExportSchema = z.object({
  teamId: z.string().uuid(),
  userId: z.string().uuid(),
  providerId: accountingProviderIdSchema,
  transactionIds: z.array(z.string().uuid()),
  includeAttachments: z.boolean().default(true),
});

export type AccountingExportPayload = z.infer<typeof accountingExportSchema>;

/**
 * Schema for accounting-sync-scheduler job
 */
export const accountingSyncSchedulerSchema = z.object({
  teamId: z.string().uuid(),
  manualSync: z.boolean().default(false),
});

export type AccountingSyncSchedulerPayload = z.infer<
  typeof accountingSyncSchedulerSchema
>;
