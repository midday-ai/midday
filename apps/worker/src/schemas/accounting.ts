import { z } from "zod";

/**
 * Provider ID enum
 */
export const accountingProviderIdSchema = z.enum([
  "xero",
  "quickbooks",
  "fortnox",
  "visma",
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
 * Schema for sync-accounting-attachments job
 */
export const accountingAttachmentSyncSchema = z.object({
  teamId: z.string().uuid(),
  providerId: accountingProviderIdSchema,
  syncRecordId: z.string().uuid(), // The accounting_sync_record ID
  transactionId: z.string().uuid(), // Midday transaction ID
  providerTransactionId: z.string(), // External provider transaction ID
  attachmentIds: z.array(z.string().uuid()), // Midday attachment IDs to upload
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

