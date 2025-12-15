import { z } from "zod";

/**
 * Supported accounting providers
 */
export const AccountingProviderIdSchema = z.enum([
  "xero",
  "quickbooks",
  "fortnox",
  "visma",
]);

export type AccountingProviderId = z.infer<typeof AccountingProviderIdSchema>;

/**
 * OAuth token set returned after authentication
 */
export interface TokenSet {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  tokenType: string;
  scope?: string[];
}

/**
 * Configuration stored in apps.config for accounting providers
 */
export interface AccountingProviderConfig {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  tenantId: string; // Xero tenant ID, QuickBooks realm ID, etc.
  tenantName?: string; // Organization name
  scope?: string[];
}

/**
 * Parameters for initializing a provider
 */
export interface ProviderInitConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  config?: AccountingProviderConfig;
}

/**
 * Transaction to sync to accounting provider
 */
export interface MappedTransaction {
  id: string;
  date: string;
  amount: number;
  currency: string;
  description: string;
  reference?: string;
  counterpartyName?: string;
  category?: string;
  attachments?: AttachmentRef[];
}

/**
 * Reference to an attachment file
 */
export interface AttachmentRef {
  id: string;
  name: string;
  path: string[];
  mimeType: string;
  size: number;
}

/**
 * Parameters for syncing transactions
 */
export interface SyncTransactionsParams {
  transactions: MappedTransaction[];
  targetAccountId: string;
  tenantId: string;
}

/**
 * Result of a sync operation
 */
export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  results: Array<{
    transactionId: string;
    providerTransactionId?: string;
    success: boolean;
    error?: string;
  }>;
}

/**
 * Account in the accounting software (bank account, etc.)
 */
export interface AccountingAccount {
  id: string;
  name: string;
  code?: string;
  type: string;
  currency?: string;
  status: "active" | "archived";
}

/**
 * Parameters for uploading an attachment
 */
export interface UploadAttachmentParams {
  tenantId: string;
  transactionId: string; // Provider's transaction ID
  fileName: string;
  mimeType: string;
  content: Buffer | ReadableStream;
}

/**
 * Result of attachment upload
 */
export interface AttachmentResult {
  success: boolean;
  attachmentId?: string;
  error?: string;
}

/**
 * Sync record status
 */
export const SyncStatusSchema = z.enum(["synced", "failed", "pending"]);
export type SyncStatus = z.infer<typeof SyncStatusSchema>;

/**
 * Sync type
 */
export const SyncTypeSchema = z.enum(["auto", "manual"]);
export type SyncType = z.infer<typeof SyncTypeSchema>;

