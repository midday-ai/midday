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
 * Provider entity types
 * Used to link attachments to the correct entity without an extra API call
 */
export const providerEntityTypeSchema = z.enum([
  "Purchase", // QuickBooks expense
  "Deposit", // QuickBooks income
  "BankTransaction", // Xero bank transaction
  "Voucher", // Fortnox voucher (verifikation)
]);

export type ProviderEntityType = z.infer<typeof providerEntityTypeSchema>;

/**
 * Schema for removed attachment info
 */
const removedAttachmentSchema = z.object({
  middayId: z.string().uuid(),
  providerId: z.string().nullable(),
});

/**
 * Schema for sync-accounting-attachments job
 */
export const accountingAttachmentSyncSchema = z.object({
  teamId: z.string().uuid(),
  providerId: accountingProviderIdSchema,
  syncRecordId: z.string().uuid().optional(), // The accounting_sync_record ID (for updates)
  transactionId: z.string().uuid(), // Midday transaction ID
  providerTransactionId: z.string(), // External provider transaction ID
  attachmentIds: z.array(z.string().uuid()), // Midday attachment IDs to upload (new)
  // Attachments to remove/unlink from the provider
  removedAttachments: z.array(removedAttachmentSchema).optional(),
  // Current mapping from DB (Midday ID -> Provider ID)
  existingSyncedAttachmentMapping: z
    .record(z.string(), z.string().nullable())
    .optional(),
  // Entity type for QuickBooks - avoids extra API call to determine Purchase vs Deposit
  providerEntityType: providerEntityTypeSchema.optional(),
  // Tax info for history note (Xero only) - added after last attachment
  taxAmount: z.number().optional(),
  taxRate: z.number().optional(),
  taxType: z.string().optional(),
  note: z.string().optional(),
  // Whether to add a summary history note after attachments (Xero only, new exports only)
  addHistoryNote: z.boolean().optional(),
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
});

export type AccountingExportPayload = z.infer<typeof accountingExportSchema>;
