import { z } from "zod";

/**
 * Banking job schemas
 * Defines Zod schemas for all banking-related job payloads
 */

// Provider enum used across banking jobs
export const providerSchema = z.enum([
  "gocardless",
  "plaid",
  "teller",
  "enablebanking",
]);

export type Provider = z.infer<typeof providerSchema>;

// Account type enum
export const accountTypeSchema = z.enum([
  "depository",
  "credit",
  "other_asset",
  "loan",
  "other_liability",
]);

export type AccountType = z.infer<typeof accountTypeSchema>;

// ============================================================================
// Sync Jobs
// ============================================================================

export const syncConnectionSchema = z.object({
  connectionId: z.string().uuid(),
  /** If true, sync all accounts regardless of error retries */
  manualSync: z.boolean().optional(),
});

export type SyncConnectionPayload = z.infer<typeof syncConnectionSchema>;

export const syncAccountSchema = z.object({
  /** Bank account ID (internal) */
  id: z.string().uuid(),
  teamId: z.string().uuid(),
  /** External account ID from provider */
  accountId: z.string(),
  accessToken: z.string().optional(),
  errorRetries: z.number().optional(),
  provider: providerSchema,
  manualSync: z.boolean().optional(),
  accountType: accountTypeSchema,
});

export type SyncAccountPayload = z.infer<typeof syncAccountSchema>;

export const upsertTransactionsSchema = z.object({
  teamId: z.string().uuid(),
  bankAccountId: z.string().uuid(),
  manualSync: z.boolean().optional(),
  transactions: z.array(
    z.object({
      id: z.string(),
      description: z.string().nullable(),
      method: z.string().nullable(),
      date: z.string(),
      name: z.string(),
      status: z.enum(["pending", "posted"]),
      counterparty_name: z.string().nullable(),
      merchant_name: z.string().nullable(),
      balance: z.number().nullable(),
      currency: z.string(),
      amount: z.number(),
      category: z.string().nullable(),
    }),
  ),
});

export type UpsertTransactionsPayload = z.infer<typeof upsertTransactionsSchema>;

// ============================================================================
// Setup & Scheduler Jobs
// ============================================================================

export const initialBankSetupSchema = z.object({
  teamId: z.string().uuid(),
  connectionId: z.string().uuid(),
});

export type InitialBankSetupPayload = z.infer<typeof initialBankSetupSchema>;

export const bankSyncSchedulerSchema = z.object({
  teamId: z.string().uuid(),
});

export type BankSyncSchedulerPayload = z.infer<typeof bankSyncSchedulerSchema>;

// ============================================================================
// Connection Management Jobs
// ============================================================================

export const deleteConnectionSchema = z.object({
  referenceId: z.string().optional().nullable(),
  provider: providerSchema,
  accessToken: z.string().optional().nullable(),
});

export type DeleteConnectionPayload = z.infer<typeof deleteConnectionSchema>;

export const reconnectConnectionSchema = z.object({
  teamId: z.string().uuid(),
  connectionId: z.string().uuid(),
  provider: z.string(),
});

export type ReconnectConnectionPayload = z.infer<typeof reconnectConnectionSchema>;

// ============================================================================
// Notification Jobs
// ============================================================================

export const transactionNotificationsSchema = z.object({
  teamId: z.string().uuid(),
});

export type TransactionNotificationsPayload = z.infer<
  typeof transactionNotificationsSchema
>;
