import type {
  AccountingAccount,
  AccountingProviderId,
  AttachmentResult,
  ProviderInitConfig,
  SyncResult,
  SyncTransactionsParams,
  TokenSet,
  UploadAttachmentParams,
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
   * Get organization/tenant details
   * @param tenantId - The tenant ID
   */
  getTenantInfo(tenantId: string): Promise<{
    id: string;
    name: string;
    currency?: string;
  }>;
}

/**
 * Base class with common functionality for accounting providers
 */
export abstract class BaseAccountingProvider implements AccountingProvider {
  abstract readonly id: AccountingProviderId;
  abstract readonly name: string;

  protected config: ProviderInitConfig;

  constructor(config: ProviderInitConfig) {
    this.config = config;
  }

  abstract buildConsentUrl(state: string): Promise<string>;
  abstract exchangeCodeForTokens(code: string): Promise<TokenSet>;
  abstract refreshTokens(refreshToken: string): Promise<TokenSet>;
  abstract getAccounts(tenantId: string): Promise<AccountingAccount[]>;
  abstract syncTransactions(params: SyncTransactionsParams): Promise<SyncResult>;
  abstract uploadAttachment(
    params: UploadAttachmentParams
  ): Promise<AttachmentResult>;
  abstract getTenantInfo(
    tenantId: string
  ): Promise<{ id: string; name: string; currency?: string }>;

  /**
   * Check if token is expired with optional buffer
   */
  isTokenExpired(expiresAt: Date, bufferSeconds = 60): boolean {
    const bufferMs = bufferSeconds * 1000;
    return new Date().getTime() >= expiresAt.getTime() - bufferMs;
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
        this.config.config.refreshToken
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

