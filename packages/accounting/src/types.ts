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
 * Type guard for AccountingProviderId
 * Use this to safely narrow string types to AccountingProviderId
 */
export function isAccountingProviderId(id: string): id is AccountingProviderId {
  return AccountingProviderIdSchema.safeParse(id).success;
}

// ============================================================================
// Error Handling Types
// ============================================================================

/**
 * Standardized error types across all accounting providers
 */
export type AccountingErrorType =
  | "rate_limit"
  | "auth_expired"
  | "validation"
  | "not_found"
  | "server_error"
  | "unknown";

/**
 * Standardized error structure for accounting operations
 */
export interface AccountingError {
  type: AccountingErrorType;
  message: string;
  /** Original error code from the provider (e.g., "429", "INVALID_ACCOUNT") */
  providerCode?: string;
  /** Whether this error can be retried */
  retryable: boolean;
}

/**
 * Rate limiting configuration for API calls
 */
export interface RateLimitConfig {
  /** Maximum calls allowed per minute */
  callsPerMinute: number;
  /** Delay in milliseconds before retrying after rate limit */
  retryDelayMs: number;
  /** Maximum number of retry attempts */
  maxRetries: number;
}

/**
 * Pre-defined rate limit configurations for providers
 */
export const RATE_LIMITS = {
  /** Xero: 60 calls per minute */
  xero: { callsPerMinute: 60, retryDelayMs: 60000, maxRetries: 3 },
  /** QuickBooks: 500 calls per minute */
  quickbooks: { callsPerMinute: 500, retryDelayMs: 60000, maxRetries: 3 },
  /** Fortnox: 25 calls per 5 seconds = 300 per minute */
  fortnox: { callsPerMinute: 300, retryDelayMs: 5000, maxRetries: 3 },
} as const satisfies Record<string, RateLimitConfig>;

// ============================================================================
// OAuth & Authentication Types
// ============================================================================

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
 * Base configuration stored in apps.config for all accounting providers
 */
const BaseProviderConfigSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresAt: z.string(),
  scope: z.array(z.string()).optional(),
  /** Default bank account ID for syncing transactions (user-selected) */
  defaultBankAccountId: z.string().optional(),
});

interface BaseProviderConfig {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  scope?: string[];
  /** Default bank account ID for syncing transactions (user-selected) */
  defaultBankAccountId?: string;
}

/**
 * Xero-specific configuration
 */
export const XeroProviderConfigSchema = BaseProviderConfigSchema.extend({
  /** Provider discriminator */
  provider: z.literal("xero"),
  /** Xero organization/tenant ID */
  tenantId: z.string(),
  /** Organization name */
  tenantName: z.string().optional(),
});

export interface XeroProviderConfig extends BaseProviderConfig {
  /** Provider discriminator */
  provider: "xero";
  /** Xero organization/tenant ID */
  tenantId: string;
  /** Organization name */
  tenantName?: string;
}

/**
 * QuickBooks-specific configuration
 */
export const QuickBooksProviderConfigSchema = BaseProviderConfigSchema.extend({
  /** Provider discriminator */
  provider: z.literal("quickbooks"),
  /** QuickBooks company/realm ID */
  realmId: z.string(),
  /** Company name */
  companyName: z.string().optional(),
});

export interface QuickBooksProviderConfig extends BaseProviderConfig {
  /** Provider discriminator */
  provider: "quickbooks";
  /** QuickBooks company/realm ID */
  realmId: string;
  /** Company name */
  companyName?: string;
}

/**
 * Fortnox-specific configuration
 * Note: Fortnox doesn't have multi-tenant like Xero - company context comes from token
 */
export const FortnoxProviderConfigSchema = BaseProviderConfigSchema.extend({
  /** Provider discriminator */
  provider: z.literal("fortnox"),
  /** Fortnox company database ID (from /3/companyinformation) */
  companyId: z.string().optional(),
  /** Company name */
  companyName: z.string().optional(),
});

export interface FortnoxProviderConfig extends BaseProviderConfig {
  /** Provider discriminator */
  provider: "fortnox";
  /** Fortnox company database ID (from /3/companyinformation) */
  companyId?: string;
  /** Company name */
  companyName?: string;
}

/**
 * Union schema for all provider configurations (discriminated by 'provider' field)
 */
export const AccountingProviderConfigSchema = z.discriminatedUnion("provider", [
  XeroProviderConfigSchema,
  QuickBooksProviderConfigSchema,
  FortnoxProviderConfigSchema,
]);

/**
 * Union type for all provider configurations
 * Discriminated by 'provider' field for type safety
 */
export type AccountingProviderConfig =
  | XeroProviderConfig
  | QuickBooksProviderConfig
  | FortnoxProviderConfig;

/**
 * Parse and validate a provider config from unknown data (e.g., from database)
 * @throws ZodError if config is invalid
 */
export function parseProviderConfig(config: unknown): AccountingProviderConfig {
  return AccountingProviderConfigSchema.parse(config);
}

/**
 * Safely parse a provider config, returning null if invalid
 */
export function safeParseProviderConfig(
  config: unknown,
): AccountingProviderConfig | null {
  const result = AccountingProviderConfigSchema.safeParse(config);
  return result.success ? result.data : null;
}

/**
 * Type guard to check if config is Xero
 */
export function isXeroConfig(
  config: AccountingProviderConfig,
): config is XeroProviderConfig {
  return config.provider === "xero";
}

/**
 * Type guard to check if config is QuickBooks
 */
export function isQuickBooksConfig(
  config: AccountingProviderConfig,
): config is QuickBooksProviderConfig {
  return config.provider === "quickbooks";
}

/**
 * Type guard to check if config is Fortnox
 */
export function isFortnoxConfig(
  config: AccountingProviderConfig,
): config is FortnoxProviderConfig {
  return config.provider === "fortnox";
}

/**
 * Get the organization/tenant ID from any provider config
 * Note: Fortnox uses companyId which may be undefined (token-based company context)
 */
export function getOrgId(config: AccountingProviderConfig): string {
  switch (config.provider) {
    case "xero":
      return config.tenantId;
    case "quickbooks":
      return config.realmId;
    case "fortnox":
      // Fortnox doesn't have multi-tenant - use companyId or fallback to "default"
      return config.companyId ?? "default";
    default: {
      const _exhaustive: never = config;
      throw new Error(
        `Unknown provider: ${(_exhaustive as { provider: string }).provider}`,
      );
    }
  }
}

/**
 * Get the organization/tenant name from any provider config
 */
export function getOrgName(
  config: AccountingProviderConfig,
): string | undefined {
  switch (config.provider) {
    case "xero":
      return config.tenantName;
    case "quickbooks":
      return config.companyName;
    case "fortnox":
      return config.companyName;
    default: {
      const _exhaustive: never = config;
      throw new Error(
        `Unknown provider: ${(_exhaustive as { provider: string }).provider}`,
      );
    }
  }
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

// ============================================================================
// Transaction Types
// ============================================================================

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
  /**
   * Category code for expense/income classification
   * - Xero: Maps to accountCode (e.g., "400")
   * - QuickBooks: Maps to AccountRef.value
   * - Fortnox: Maps to contra-account in voucher row
   * Each provider handles mapping internally
   */
  categoryReportingCode?: string;
  /**
   * For double-entry systems (Fortnox): the bank/cash account code
   * Used as one side of the journal entry (debit for income, credit for expense)
   */
  bankAccountCode?: string;
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
 * Entity types created in providers
 * Used for attachment linking without extra API calls
 */
export type ProviderEntityType =
  | "Purchase" // QuickBooks expense
  | "SalesReceipt" // QuickBooks income
  | "BankTransaction" // Xero bank transaction
  | "Voucher"; // Fortnox voucher (verifikation)

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
    /** Entity type created (for attachment linking) */
    providerEntityType?: ProviderEntityType;
    success: boolean;
    error?: string;
  }>;
}

// ============================================================================
// Account Types
// ============================================================================

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

// ============================================================================
// Attachment Types
// ============================================================================

/**
 * Parameters for uploading an attachment
 */
export interface UploadAttachmentParams {
  tenantId: string;
  transactionId: string; // Provider's transaction ID
  fileName: string;
  mimeType: string;
  content: Buffer | ReadableStream;
  /** Entity type for QuickBooks - avoids extra API call to determine entity type */
  entityType?: ProviderEntityType;
}

/**
 * Result of attachment upload
 */
export interface AttachmentResult {
  success: boolean;
  attachmentId?: string;
  error?: string;
}

// ============================================================================
// Sync Record Types
// ============================================================================

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
