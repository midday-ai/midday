import {
  ACCOUNTING_ERROR_CODES,
  type AccountingAccount,
  type AccountingError,
  AccountingOperationError,
  type AccountingProviderId,
  type AttachmentResult,
  type DeleteAttachmentParams,
  type DeleteAttachmentResult,
  type ProviderInitConfig,
  type RateLimitConfig,
  type SyncResult,
  type SyncTransactionsParams,
  type TokenSet,
  type UploadAttachmentParams,
} from "./types";

/**
 * Abstract interface for accounting providers (Xero, QuickBooks, etc.)
 *
 * Each provider implements this interface to provide a consistent API
 * for OAuth authentication, transaction syncing, and attachment uploads.
 */
export interface AccountingProvider {
  /**
   * Provider identifier
   */
  readonly id: AccountingProviderId;

  /**
   * Human-readable provider name
   */
  readonly name: string;

  /**
   * Build the OAuth consent URL for user authorization
   * @param state - State parameter for CSRF protection (encrypted)
   * @returns The URL to redirect the user to
   */
  buildConsentUrl(state: string): Promise<string>;

  /**
   * Exchange authorization code for access tokens
   * @param code - The authorization code from the OAuth callback
   * @returns Token set with access and refresh tokens
   */
  exchangeCodeForTokens(code: string): Promise<TokenSet>;

  /**
   * Refresh expired access tokens
   * @param refreshToken - The refresh token
   * @returns New token set
   */
  refreshTokens(refreshToken: string): Promise<TokenSet>;

  /**
   * Check if the current token is expired or about to expire
   * @param expiresAt - Token expiration date
   * @param bufferSeconds - Buffer before expiration (default: 60)
   */
  isTokenExpired(expiresAt: Date, bufferSeconds?: number): boolean;

  /**
   * Get available bank/cash accounts from the accounting software
   * @param tenantId - The tenant/organization ID
   * @returns List of accounts
   */
  getAccounts(tenantId: string): Promise<AccountingAccount[]>;

  /**
   * Sync transactions to the accounting software
   * @param params - Sync parameters including transactions and target account
   * @returns Sync result with success/failure details
   */
  syncTransactions(params: SyncTransactionsParams): Promise<SyncResult>;

  /**
   * Upload an attachment to a transaction
   * @param params - Upload parameters
   * @returns Upload result with attachment ID
   */
  uploadAttachment(params: UploadAttachmentParams): Promise<AttachmentResult>;

  /**
   * Delete/unlink an attachment from a transaction
   * @param params - Delete parameters
   * @returns Delete result
   */
  deleteAttachment(
    params: DeleteAttachmentParams,
  ): Promise<DeleteAttachmentResult>;

  /**
   * Get organization/tenant details
   * @param tenantId - The tenant ID
   */
  getTenantInfo(tenantId: string): Promise<{
    id: string;
    name: string;
    currency?: string;
  }>;

  /**
   * Get tenants (organizations) connected to this provider
   * @returns List of tenants with their IDs and names
   */
  getTenants(): Promise<
    Array<{ tenantId: string; tenantName: string; tenantType: string }>
  >;

  /**
   * Check if the connection to the provider is valid
   * Useful for health checks without making data calls
   * @returns Connection status
   */
  checkConnection(): Promise<{ connected: boolean; error?: string }>;

  /**
   * Revoke tokens and disconnect from the provider
   * Optional - not all providers support programmatic token revocation
   * @returns void on success, throws on error
   */
  disconnect?(): Promise<void>;

  /**
   * Add a history/notes entry to a transaction (Xero only)
   * Optional - only implemented by Xero provider
   * @param params - Transaction ID, tax info, and note
   */
  addTransactionHistoryNote?(params: {
    tenantId: string;
    transactionId: string;
    taxAmount?: number;
    taxRate?: number;
    taxType?: string;
    note?: string;
  }): Promise<void>;
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Base class with common functionality for accounting providers
 */
export abstract class BaseAccountingProvider implements AccountingProvider {
  abstract readonly id: AccountingProviderId;
  abstract readonly name: string;

  protected config: ProviderInitConfig;

  /**
   * Rate limiting configuration - override in subclasses
   * Default values are conservative (10 calls/min)
   */
  protected readonly rateLimitConfig: RateLimitConfig = {
    callsPerMinute: 10,
    maxConcurrent: 1,
    callDelayMs: 6000, // 10 calls/min = 1 every 6 seconds
    retryDelayMs: 60_000,
    maxRetries: 3,
  };

  constructor(config: ProviderInitConfig) {
    this.config = config;
  }

  abstract buildConsentUrl(state: string): Promise<string>;
  abstract exchangeCodeForTokens(code: string): Promise<TokenSet>;
  abstract refreshTokens(refreshToken: string): Promise<TokenSet>;
  abstract getAccounts(tenantId: string): Promise<AccountingAccount[]>;
  abstract syncTransactions(
    params: SyncTransactionsParams,
  ): Promise<SyncResult>;
  abstract uploadAttachment(
    params: UploadAttachmentParams,
  ): Promise<AttachmentResult>;
  abstract deleteAttachment(
    params: DeleteAttachmentParams,
  ): Promise<DeleteAttachmentResult>;
  abstract getTenantInfo(
    tenantId: string,
  ): Promise<{ id: string; name: string; currency?: string }>;

  abstract getTenants(): Promise<
    Array<{ tenantId: string; tenantName: string; tenantType: string }>
  >;

  abstract checkConnection(): Promise<{ connected: boolean; error?: string }>;

  /**
   * Parse provider-specific errors into standardized format
   * Override in subclasses for provider-specific error handling
   */
  protected parseError(error: unknown): AccountingError {
    // First, extract the message using provider-specific logic
    const message = this.extractErrorMessage(error);
    const messageLower = message.toLowerCase();

    // Check for common HTTP error patterns
    if (messageLower.includes("429") || messageLower.includes("rate limit")) {
      return {
        type: "rate_limit",
        code: ACCOUNTING_ERROR_CODES.RATE_LIMIT,
        message: "Rate limit exceeded. Please try again later.",
        retryable: true,
      };
    }

    if (messageLower.includes("401") || messageLower.includes("unauthorized")) {
      return {
        type: "auth_expired",
        code: ACCOUNTING_ERROR_CODES.AUTH_EXPIRED,
        message: "Authentication failed. Please reconnect your account.",
        retryable: false,
      };
    }

    if (messageLower.includes("400") || messageLower.includes("validation")) {
      return {
        type: "validation",
        code: ACCOUNTING_ERROR_CODES.VALIDATION,
        message,
        retryable: false,
      };
    }

    if (messageLower.includes("404") || messageLower.includes("not found")) {
      return {
        type: "not_found",
        code: ACCOUNTING_ERROR_CODES.NOT_FOUND,
        message,
        retryable: false,
      };
    }

    if (/\b5\d{2}\b/.test(messageLower)) {
      // 5xx errors
      return {
        type: "server_error",
        code: ACCOUNTING_ERROR_CODES.SERVER_ERROR,
        message: message || "Server error. Please try again later.",
        retryable: true,
      };
    }

    return {
      type: "unknown",
      code: ACCOUNTING_ERROR_CODES.UNKNOWN,
      message,
      retryable: false,
    };
  }

  /**
   * Extract error message from various error formats
   * Handles: stringified JSON, Error objects, API response structures
   */
  protected extractErrorMessage(error: unknown): string {
    // Handle stringified JSON (some SDKs throw strings)
    if (typeof error === "string") {
      try {
        return this.extractErrorMessage(JSON.parse(error));
      } catch {
        return error.length < 500 ? error : "Error response too long";
      }
    }

    // Handle standard Error
    if (error instanceof Error) {
      return error.message;
    }

    // Handle object structures
    if (error && typeof error === "object") {
      const err = error as Record<string, unknown>;

      // Extract from response.body (common API SDK pattern)
      const body = this.extractBody(err);
      if (body) {
        const msg = this.extractFromBody(body);
        if (msg) return msg;
      }

      // Status code fallback
      const status =
        (err.response as Record<string, unknown>)?.statusCode ?? err.statusCode;
      if (status) return `API error (HTTP ${status})`;

      // Direct message property
      if (err.message) return String(err.message);
    }

    return "An unknown error occurred";
  }

  /** Extract body from error object */
  private extractBody(
    err: Record<string, unknown>,
  ): Record<string, unknown> | null {
    const response = err.response as Record<string, unknown> | undefined;
    if (response?.body && typeof response.body === "object") {
      return response.body as Record<string, unknown>;
    }
    if (err.body && typeof err.body === "object") {
      return err.body as Record<string, unknown>;
    }
    return null;
  }

  /** Extract message from body object */
  private extractFromBody(body: Record<string, unknown>): string | null {
    // Xero validation errors: Elements[0].ValidationErrors[0].Message
    if (body.Elements && Array.isArray(body.Elements)) {
      const elem = body.Elements[0] as Record<string, unknown> | undefined;
      const validationErrors = elem?.ValidationErrors as
        | Array<Record<string, unknown>>
        | undefined;
      if (validationErrors?.[0]?.Message) {
        return String(validationErrors[0].Message);
      }
    }

    // Common error fields (priority order)
    for (const key of [
      "Detail",
      "detail",
      "Message",
      "message",
      "Title",
      "error",
      "error_description",
    ]) {
      if (body[key] && typeof body[key] === "string") {
        return body[key] as string;
      }
    }

    return null;
  }

  /**
   * Check if an error is a rate limit error
   */
  protected isRateLimitError(error: unknown): boolean {
    const parsed = this.parseError(error);
    return parsed.type === "rate_limit";
  }

  /**
   * Execute an API call with retry logic for rate limits and transient errors
   * Uses the provider's rateLimitConfig for retry behavior
   */
  protected async withRetry<T>(
    operation: () => Promise<T>,
    context: string,
  ): Promise<T> {
    let lastError: AccountingError | null = null;

    for (
      let attempt = 1;
      attempt <= this.rateLimitConfig.maxRetries;
      attempt++
    ) {
      try {
        return await operation();
      } catch (error) {
        lastError = this.parseError(error);

        // Retry on rate limit or server errors
        if (lastError.retryable && attempt < this.rateLimitConfig.maxRetries) {
          const delay =
            lastError.type === "rate_limit"
              ? this.rateLimitConfig.retryDelayMs
              : Math.min(
                  this.rateLimitConfig.retryDelayMs * 2 ** (attempt - 1),
                  300_000,
                );

          await sleep(delay);
          continue;
        }

        throw new AccountingOperationError({
          ...lastError,
          message: `${context}: ${lastError.message}`,
        });
      }
    }

    throw new AccountingOperationError(
      lastError ?? {
        type: "unknown",
        code: ACCOUNTING_ERROR_CODES.UNKNOWN,
        message: `${context}: Max retries exceeded`,
        retryable: false,
      },
    );
  }

  /**
   * Check if token is expired with optional buffer
   */
  isTokenExpired(expiresAt: Date, bufferSeconds = 60): boolean {
    const bufferMs = bufferSeconds * 1000;
    return Date.now() >= expiresAt.getTime() - bufferMs;
  }

  /**
   * Get access token, refreshing if needed
   */
  protected async getValidAccessToken(): Promise<string> {
    if (!this.config.config) {
      throw new Error("Provider not configured with tokens");
    }

    const expiresAt = new Date(this.config.config.expiresAt);

    if (this.isTokenExpired(expiresAt)) {
      const newTokens = await this.refreshTokens(
        this.config.config.refreshToken,
      );
      // Update config with new tokens
      this.config.config = {
        ...this.config.config,
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        expiresAt: newTokens.expiresAt.toISOString(),
      };
      return newTokens.accessToken;
    }

    return this.config.config.accessToken;
  }
}
