import { logger } from "@midday/logger";
import { parseISO } from "date-fns";
import { BaseAccountingProvider } from "../provider";
import {
  ACCOUNTING_ERROR_CODES,
  type AccountingAccount,
  type AccountingError,
  AccountingOperationError,
  type AccountingProviderId,
  type AttachmentResult,
  type DeleteAttachmentParams,
  type DeleteAttachmentResult,
  type MappedTransaction,
  type ProviderInitConfig,
  RATE_LIMITS,
  type RateLimitConfig,
  type SyncResult,
  type SyncTransactionsParams,
  type TokenSet,
  type UploadAttachmentParams,
} from "../types";
import {
  appendTaxInfoToDescription,
  buildPrivateNote,
  ensureFileExtension,
  sleep,
  streamToBuffer,
} from "../utils";

// ============================================================================
// Fortnox Types
// ============================================================================

type FortnoxScope =
  | "bookkeeping"
  | "companyinformation"
  | "archive"
  | "connectfile"
  | "inbox"
  | "settings";

/** Fortnox API base URLs */
const FORTNOX_AUTH_URL = "https://apps.fortnox.se/oauth-v1";
const FORTNOX_API_URL = "https://api.fortnox.se/3";

/**
 * Fortnox OAuth scopes required for the integration
 * See: https://www.fortnox.se/developer/guides-and-good-to-know/scopes
 */
export const FORTNOX_SCOPES: FortnoxScope[] = [
  "bookkeeping", // Read/write vouchers and accounts
  "companyinformation", // Read company info
  "archive", // Upload files
  "connectfile", // Connect files to vouchers
  "inbox", // Upload files to inbox
  "settings", // Read/write settings (for financial years)
];

/** Default expense account code for Swedish BAS chart */
const DEFAULT_EXPENSE_ACCOUNT = "4000";
/** Default income account code for Swedish BAS chart */
const DEFAULT_INCOME_ACCOUNT = "3000";

/** Request timeout in milliseconds (30 seconds) */
const REQUEST_TIMEOUT_MS = 30_000;

// ============================================================================
// Fortnox API Response Types
// ============================================================================

interface FortnoxTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface FortnoxCompanyInfo {
  CompanyInformation?: {
    DatabaseNumber?: number;
    CompanyName?: string;
  };
}

interface FortnoxAccount {
  Number?: number;
  Description?: string;
  Active?: boolean;
}

interface FortnoxAccountsResponse {
  Accounts?: FortnoxAccount[];
}

interface FortnoxVoucherRow {
  Account: number;
  Debit: number;
  Credit: number;
  Description?: string;
}

interface FortnoxVoucher {
  VoucherSeries?: string;
  VoucherNumber?: number;
  Year?: number;
}

interface FortnoxVoucherResponse {
  Voucher?: FortnoxVoucher;
}

interface FortnoxFileResponse {
  File?: {
    Id?: string;
    Name?: string;
    Path?: string;
  };
}

interface FortnoxFinancialYear {
  Id?: number;
  FromDate?: string;
  ToDate?: string;
  AccountingMethod?: string;
}

interface FortnoxFinancialYearsResponse {
  FinancialYears?: FortnoxFinancialYear[];
}

interface FortnoxFinancialYearResponse {
  FinancialYear?: FortnoxFinancialYear;
}

// ============================================================================
// Fortnox Provider Implementation
// ============================================================================

/**
 * Fortnox accounting provider implementation
 *
 * Fortnox uses vouchers (verifikationer) for all transactions.
 * Each voucher has debit/credit rows that must balance.
 *
 * Transaction flow:
 * 1. Expense (negative amount): Credit bank account, Debit expense account
 * 2. Income (positive amount): Debit bank account, Credit income account
 */
export class FortnoxProvider extends BaseAccountingProvider {
  readonly id: AccountingProviderId = "fortnox";
  readonly name = "Fortnox";

  /**
   * Fortnox rate limit: 25 calls per 5 seconds = 300 per minute
   * https://apps.fortnox.se/apidocs
   */
  protected override readonly rateLimitConfig: RateLimitConfig =
    RATE_LIMITS.fortnox;

  private accessToken: string | null = null;
  private refreshTokenValue: string | null = null;
  private tokenExpiresAt: Date | null = null;

  constructor(initConfig: ProviderInitConfig) {
    super(initConfig);

    // Initialize tokens from stored config if available
    if (initConfig.config && initConfig.config.provider === "fortnox") {
      this.accessToken = initConfig.config.accessToken;
      this.refreshTokenValue = initConfig.config.refreshToken;
      this.tokenExpiresAt = new Date(initConfig.config.expiresAt);
    }
  }

  // ============================================================================
  // HTTP Helper Methods
  // ============================================================================

  /**
   * Validate and return account code, throwing an error if invalid
   * Fortnox uses 4-digit Swedish BAS account codes
   *
   * @throws AccountingOperationError if the code is invalid format
   */
  private getValidAccountCode(
    categoryReportingCode: string | undefined,
    transactionId: string,
    defaultAccount: string,
  ): string {
    // If no category reporting code provided, use default
    if (!categoryReportingCode) {
      return defaultAccount;
    }

    // Valid Fortnox account codes are 4-digit numbers (Swedish BAS)
    const isValid = /^\d{4}$/.test(categoryReportingCode);

    if (!isValid) {
      throw new AccountingOperationError({
        type: "invalid_account",
        code: ACCOUNTING_ERROR_CODES.INVALID_ACCOUNT,
        message: `Invalid account code '${categoryReportingCode}'. Fortnox requires 4-digit BAS account codes (e.g., 4000, 5400).`,
        retryable: false,
        metadata: {
          transactionId,
          invalidCode: categoryReportingCode,
          expectedFormat: "4-digit number",
        },
      });
    }

    return categoryReportingCode;
  }

  /**
   * Make an authenticated API call to Fortnox
   */
  private async apiCall<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    if (!this.accessToken) {
      throw new Error("Fortnox client not initialized - no access token");
    }

    const url = `${FORTNOX_API_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Fortnox API error ${response.status}: ${errorText || response.statusText}`,
      );
    }

    return response.json() as Promise<T>;
  }

  /**
   * Upload a file to Fortnox (multipart/form-data)
   */
  private async uploadFile(
    endpoint: string,
    fileName: string,
    content: Buffer,
    folder?: string,
  ): Promise<FortnoxFileResponse> {
    if (!this.accessToken) {
      throw new Error("Fortnox client not initialized - no access token");
    }

    const formData = new FormData();
    // Convert Buffer to Uint8Array for Blob compatibility
    const uint8Array = new Uint8Array(content);
    formData.append(
      "file",
      new Blob([uint8Array], { type: "application/octet-stream" }),
      fileName,
    );

    const url = new URL(`${FORTNOX_API_URL}${endpoint}`);
    if (folder) {
      url.searchParams.set("path", folder);
    }

    const response = await fetch(url.toString(), {
      method: "POST",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        Accept: "application/json",
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Fortnox file upload error ${response.status}: ${errorText || response.statusText}`,
      );
    }

    return response.json() as Promise<FortnoxFileResponse>;
  }

  /**
   * Extract error message from Fortnox API errors
   * Fortnox returns: { ErrorInformation: { error: 1, message: "...", code: 123 } }
   */
  protected override extractErrorMessage(error: unknown): string {
    // Handle stringified JSON
    if (typeof error === "string") {
      try {
        const parsed = JSON.parse(error);
        return this.extractErrorMessage(parsed);
      } catch {
        return error.length < 500 ? error : "Error response too long";
      }
    }

    // Handle Error objects
    if (error instanceof Error) {
      // Check if message contains Fortnox error JSON
      const match = error.message.match(/\{.*ErrorInformation.*\}/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          if (parsed.ErrorInformation?.message) {
            return String(parsed.ErrorInformation.message);
          }
          if (parsed.ErrorInformation?.Message) {
            return String(parsed.ErrorInformation.Message);
          }
        } catch {
          // Not valid JSON, continue
        }
      }
      return error.message;
    }

    // Handle Fortnox response objects
    if (error && typeof error === "object") {
      const err = error as Record<string, unknown>;

      // Fortnox ErrorInformation structure
      const errorInfo = err.ErrorInformation as
        | Record<string, unknown>
        | undefined;
      if (errorInfo) {
        if (errorInfo.message) return String(errorInfo.message);
        if (errorInfo.Message) return String(errorInfo.Message);
      }

      // Direct message
      if (err.message) return String(err.message);
    }

    return "Unknown Fortnox error";
  }

  /**
   * Parse Fortnox-specific errors into standardized format
   */
  protected override parseError(error: unknown): AccountingError {
    // Check if it's already an AccountingOperationError with structured data
    if (error instanceof AccountingOperationError) {
      return error.toJSON();
    }

    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      // Check for rate limit error
      if (message.includes("429") || message.includes("too many requests")) {
        logger.warn("Fortnox rate limit hit", { provider: "fortnox" });
        return {
          type: "rate_limit",
          code: ACCOUNTING_ERROR_CODES.RATE_LIMIT,
          message: "Rate limit exceeded. Please try again in a few seconds.",
          providerCode: "429",
          retryable: true,
        };
      }

      // Check for auth errors
      if (message.includes("401") || message.includes("unauthorized")) {
        return {
          type: "auth_expired",
          code: ACCOUNTING_ERROR_CODES.AUTH_EXPIRED,
          message:
            "Authentication failed. Please reconnect your Fortnox account.",
          providerCode: "401",
          retryable: false,
        };
      }

      // Check for validation errors
      if (message.includes("400") || message.includes("validation")) {
        return {
          type: "validation",
          code: ACCOUNTING_ERROR_CODES.VALIDATION,
          message: `Validation error: ${error.message}`,
          providerCode: "400",
          retryable: false,
        };
      }

      // Check for not found
      if (message.includes("404") || message.includes("not found")) {
        return {
          type: "not_found",
          code: ACCOUNTING_ERROR_CODES.NOT_FOUND,
          message: error.message,
          providerCode: "404",
          retryable: false,
        };
      }

      // Server errors
      if (message.includes("500") || message.includes("internal server")) {
        return {
          type: "server_error",
          code: ACCOUNTING_ERROR_CODES.SERVER_ERROR,
          message: "Fortnox server error. Please try again later.",
          providerCode: "500",
          retryable: true,
        };
      }

      return {
        type: "unknown",
        code: ACCOUNTING_ERROR_CODES.UNKNOWN,
        message: error.message,
        retryable: false,
      };
    }

    return {
      type: "unknown",
      code: ACCOUNTING_ERROR_CODES.UNKNOWN,
      message: String(error),
      retryable: false,
    };
  }

  // ============================================================================
  // OAuth Methods
  // ============================================================================

  /**
   * Build the consent URL for Fortnox OAuth flow
   */
  async buildConsentUrl(state: string): Promise<string> {
    const url = new URL(`${FORTNOX_AUTH_URL}/auth`);
    url.searchParams.set("client_id", this.config.clientId);
    url.searchParams.set("redirect_uri", this.config.redirectUri);
    url.searchParams.set("scope", FORTNOX_SCOPES.join(" "));
    url.searchParams.set("state", state);
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("response_type", "code");
    url.searchParams.set("account_type", "service");
    return url.toString();
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<TokenSet> {
    const credentials = Buffer.from(
      `${this.config.clientId}:${this.config.clientSecret}`,
    ).toString("base64");

    const response = await fetch(`${FORTNOX_AUTH_URL}/token`, {
      method: "POST",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: this.config.redirectUri,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Fortnox token exchange failed: ${response.status} ${errorText}`,
      );
    }

    const tokens = (await response.json()) as FortnoxTokenResponse;

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error("Failed to get tokens from Fortnox");
    }

    // Store tokens locally
    this.accessToken = tokens.access_token;
    this.refreshTokenValue = tokens.refresh_token;
    // Fortnox access tokens expire in 1 hour (expires_in is in seconds)
    this.tokenExpiresAt = new Date(
      Date.now() + (tokens.expires_in || 3600) * 1000,
    );

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: this.tokenExpiresAt,
      tokenType: tokens.token_type || "Bearer",
      scope: FORTNOX_SCOPES as string[],
    };
  }

  /**
   * Refresh the access token using the refresh token
   */
  async refreshTokens(refreshToken: string): Promise<TokenSet> {
    logger.info("Refreshing Fortnox tokens", { provider: "fortnox" });

    const credentials = Buffer.from(
      `${this.config.clientId}:${this.config.clientSecret}`,
    ).toString("base64");

    const response = await fetch(`${FORTNOX_AUTH_URL}/token`, {
      method: "POST",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("Failed to refresh Fortnox tokens", {
        provider: "fortnox",
        status: response.status,
        error: errorText,
      });
      throw new Error(
        `Fortnox token refresh failed: ${response.status} ${errorText}`,
      );
    }

    const tokens = (await response.json()) as FortnoxTokenResponse;

    if (!tokens.access_token) {
      throw new Error("Failed to refresh Fortnox tokens - no access token");
    }

    // Update local state
    this.accessToken = tokens.access_token;
    this.refreshTokenValue = tokens.refresh_token ?? refreshToken;
    this.tokenExpiresAt = new Date(
      Date.now() + (tokens.expires_in || 3600) * 1000,
    );

    logger.info("Fortnox tokens refreshed successfully", {
      provider: "fortnox",
    });

    return {
      accessToken: this.accessToken,
      refreshToken: this.refreshTokenValue,
      expiresAt: this.tokenExpiresAt,
      tokenType: tokens.token_type || "Bearer",
      scope: FORTNOX_SCOPES as string[],
    };
  }

  /**
   * Check if token is expired (with 5 min buffer)
   */
  isTokenExpired(expiresAt: Date): boolean {
    const bufferMs = 5 * 60 * 1000; // 5 minutes
    return Date.now() >= expiresAt.getTime() - bufferMs;
  }

  /**
   * Disconnect from Fortnox - clear local state
   * Note: Fortnox doesn't have a token revocation endpoint
   */
  async disconnect(): Promise<void> {
    this.accessToken = null;
    this.refreshTokenValue = null;
    this.tokenExpiresAt = null;
  }

  // ============================================================================
  // Company/Tenant Methods
  // ============================================================================

  /**
   * Get tenant info (company information in Fortnox)
   * Note: tenantId is ignored in Fortnox as it's single-tenant
   */
  async getTenantInfo(
    _tenantId: string,
  ): Promise<{ id: string; name: string; currency?: string }> {
    const response = await this.apiCall<FortnoxCompanyInfo>(
      "/companyinformation",
    );

    return {
      id: response.CompanyInformation?.DatabaseNumber?.toString() ?? "default",
      name: response.CompanyInformation?.CompanyName ?? "Unknown",
      currency: "SEK", // Fortnox is primarily Swedish
    };
  }

  /**
   * Get tenants - Fortnox is single-tenant, returns current company
   */
  async getTenants(): Promise<
    Array<{ tenantId: string; tenantName: string; tenantType: string }>
  > {
    const tenant = await this.getTenantInfo("default");
    return [
      {
        tenantId: tenant.id,
        tenantName: tenant.name,
        tenantType: "COMPANY", // Fortnox is always a company
      },
    ];
  }

  /**
   * Check connection status
   */
  async checkConnection(): Promise<{ connected: boolean; error?: string }> {
    try {
      await this.getTenantInfo("default");
      return { connected: true };
    } catch (error) {
      const parsed = this.parseError(error);
      return {
        connected: false,
        error: parsed.message,
      };
    }
  }

  // ============================================================================
  // Account Methods
  // ============================================================================

  /**
   * Get accounts from Fortnox
   * Returns bank/cash accounts suitable for transaction sync
   * Falls back to default 1930 (Swedish standard bank account) if none found
   */
  async getAccounts(_tenantId: string): Promise<AccountingAccount[]> {
    return this.withRetry(async () => {
      const response = await this.apiCall<FortnoxAccountsResponse>("/accounts");

      if (!response.Accounts) {
        // Return default account if API returns no accounts
        logger.info("No accounts from Fortnox API, using default 1930", {
          provider: "fortnox",
        });
        return [this.getDefaultBankAccount()];
      }

      // Filter for bank/cash accounts (typically 19xx in Swedish BAS chart)
      // Also include other liquid accounts the user might want to use
      const accounts = response.Accounts.filter((account) => {
        // Active accounts only
        if (!account.Active) return false;

        // Bank accounts are typically in 19xx range
        const accountNum = account.Number ?? 0;
        return (
          (accountNum >= 1900 && accountNum <= 1999) || // Bank accounts
          (accountNum >= 1600 && accountNum <= 1699)
        ); // Other receivables/cash
      }).map((account) => ({
        id: account.Number?.toString() ?? "",
        name: account.Description ?? `Account ${account.Number}`,
        code: account.Number?.toString(),
        type: this.getAccountType(account.Number ?? 0),
        currency: "SEK", // Fortnox is primarily Swedish
        status: account.Active ? ("active" as const) : ("archived" as const),
      }));

      // If no matching accounts found, return default
      if (accounts.length === 0) {
        logger.info("No bank accounts in expected range, using default 1930", {
          provider: "fortnox",
        });
        return [this.getDefaultBankAccount()];
      }

      return accounts;
    }, "getAccounts");
  }

  /**
   * Get default Swedish bank account (1930 - Företagskonto/checkkonto)
   */
  private getDefaultBankAccount(): AccountingAccount {
    return {
      id: "1930",
      name: "Företagskonto",
      code: "1930",
      type: "BANK",
      currency: "SEK",
      status: "active" as const,
    };
  }

  /**
   * Determine account type based on Swedish BAS chart number
   */
  private getAccountType(accountNumber: number): string {
    if (accountNumber >= 1900 && accountNumber <= 1999) {
      return "BANK";
    }
    if (accountNumber >= 1600 && accountNumber <= 1699) {
      return "CASH";
    }
    return "OTHER";
  }

  // ============================================================================
  // Transaction Sync Methods
  // ============================================================================

  /**
   * Sync transactions to Fortnox as vouchers
   * Always creates new vouchers - user can re-export to create updated versions
   */
  async syncTransactions(params: SyncTransactionsParams): Promise<SyncResult> {
    // Note: Fortnox API doesn't support idempotency keys, so jobId is not used here.
    // Duplicate prevention relies entirely on our sync records table.
    const { transactions, targetAccountId, tenantId } = params;

    // Sort by date ascending for clean voucher number sequence
    // Fortnox assigns voucher numbers in creation order, so sorting by date
    // ensures numbers roughly follow chronological order (better for auditing)
    const sortedTransactions = [...transactions].sort(
      (a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime(),
    );

    logger.info("Starting Fortnox transaction sync", {
      provider: "fortnox",
      transactionCount: sortedTransactions.length,
      targetAccountId,
      tenantId,
    });

    const results: SyncResult["results"] = [];
    let syncedCount = 0;
    let failedCount = 0;

    // Fortnox rate limit: 25 requests per 5 seconds = 200ms per request
    // Use 250ms to stay safely under the limit
    const THROTTLE_DELAY_MS = 250;

    for (let i = 0; i < sortedTransactions.length; i++) {
      const tx = sortedTransactions[i]!;

      // Throttle between calls to respect rate limit (skip first call)
      if (i > 0) {
        await sleep(THROTTLE_DELAY_MS);
      }

      try {
        const result = await this.createVoucher(tx, targetAccountId);
        results.push({
          transactionId: tx.id,
          providerTransactionId: result.voucherId,
          providerEntityType: "Voucher",
          success: true,
        });
        syncedCount++;
      } catch (error) {
        const parsed = this.parseError(error);
        logger.error("Fortnox transaction sync failed", {
          provider: "fortnox",
          transactionId: tx.id,
          error: parsed.message,
          errorCode: parsed.code,
        });
        results.push({
          transactionId: tx.id,
          success: false,
          error: parsed.message,
          errorCode: parsed.code,
        });
        failedCount++;
      }
    }

    logger.info("Fortnox transaction sync completed", {
      provider: "fortnox",
      syncedCount,
      failedCount,
      totalTransactions: sortedTransactions.length,
    });

    return {
      success: failedCount === 0,
      syncedCount,
      failedCount,
      results,
    };
  }

  // ============================================================================
  // Financial Year Methods
  // ============================================================================

  // Cache for financial years to avoid repeated API calls
  private financialYearsCache: FortnoxFinancialYear[] | null = null;
  private createdYearsCache: Set<number> = new Set();
  // Cache for dates we've already verified have a financial year
  private verifiedDatesCache: Set<string> = new Set();

  /**
   * Get all financial years from Fortnox
   */
  private async getAllFinancialYears(): Promise<FortnoxFinancialYear[]> {
    if (this.financialYearsCache) {
      return this.financialYearsCache;
    }
    const response =
      await this.apiCall<FortnoxFinancialYearsResponse>("/financialyears");
    this.financialYearsCache = response.FinancialYears ?? [];
    return this.financialYearsCache;
  }

  /**
   * Check if a date falls within any cached financial year range
   * Returns true if we can determine from cache, false if API call needed
   */
  private isDateInCachedYears(date: string): boolean {
    if (!this.financialYearsCache || this.financialYearsCache.length === 0) {
      return false;
    }

    const checkDate = parseISO(date);
    return this.financialYearsCache.some((year) => {
      if (!year.FromDate || !year.ToDate) return false;
      const fromDate = parseISO(year.FromDate);
      const toDate = parseISO(year.ToDate);
      return checkDate >= fromDate && checkDate <= toDate;
    });
  }

  /**
   * Check if a financial year exists for a specific date
   * Uses caching to minimize API calls during batch operations.
   * See: https://www.fortnox.se/developer/guides-and-good-to-know/best-practices/vouchers
   */
  private async hasFinancialYearForDate(date: string): Promise<boolean> {
    // Check if we've already verified this date
    if (this.verifiedDatesCache.has(date)) {
      return true;
    }

    // Check against cached financial years first (no API call)
    if (this.isDateInCachedYears(date)) {
      this.verifiedDatesCache.add(date);
      return true;
    }

    // If we have a cache but date isn't in it, it's likely missing
    // Only make API call if we haven't loaded cache yet
    if (this.financialYearsCache !== null) {
      return false;
    }

    // First time: fetch all financial years and check
    try {
      await this.getAllFinancialYears();
      if (this.isDateInCachedYears(date)) {
        this.verifiedDatesCache.add(date);
        return true;
      }
      return false;
    } catch (error) {
      logger.warn("Failed to check financial year for date", {
        provider: "fortnox",
        date,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Get the period pattern from existing financial years
   * Returns the month/day pattern to use for new years
   */
  private getPeriodPattern(existingYears: FortnoxFinancialYear[]): {
    fromMonth: number;
    fromDay: number;
    toMonth: number;
    toDay: number;
  } {
    // Default to calendar year (Jan 1 - Dec 31)
    let fromMonth = 1;
    let fromDay = 1;
    let toMonth = 12;
    let toDay = 31;

    if (existingYears.length > 0 && existingYears[0]?.FromDate) {
      const existingFrom = parseISO(existingYears[0].FromDate);
      const existingTo = existingYears[0].ToDate
        ? parseISO(existingYears[0].ToDate)
        : null;

      fromMonth = existingFrom.getMonth() + 1;
      fromDay = existingFrom.getDate();

      if (existingTo) {
        toMonth = existingTo.getMonth() + 1;
        toDay = existingTo.getDate();
      }
    }

    return { fromMonth, fromDay, toMonth, toDay };
  }

  /**
   * Create a single financial year in Fortnox
   */
  private async createSingleFinancialYear(
    targetYear: number,
    pattern: {
      fromMonth: number;
      fromDay: number;
      toMonth: number;
      toDay: number;
    },
  ): Promise<void> {
    // Check if already created this session
    if (this.createdYearsCache.has(targetYear)) {
      return;
    }

    // Handle broken fiscal years (e.g., Jul 2024 - Jun 2025)
    const isBrokenFiscalYear = pattern.fromMonth > pattern.toMonth;
    const toYear = isBrokenFiscalYear ? targetYear + 1 : targetYear;

    const fromDate = `${targetYear}-${String(pattern.fromMonth).padStart(2, "0")}-${String(pattern.fromDay).padStart(2, "0")}`;
    const toDate = `${toYear}-${String(pattern.toMonth).padStart(2, "0")}-${String(pattern.toDay).padStart(2, "0")}`;

    logger.info("Creating financial year in Fortnox", {
      provider: "fortnox",
      targetYear,
      fromDate,
      toDate,
    });

    const response = await this.apiCall<FortnoxFinancialYearResponse>(
      "/financialyears",
      {
        method: "POST",
        body: JSON.stringify({
          FinancialYear: {
            FromDate: fromDate,
            ToDate: toDate,
            AccountingMethod: "ACCRUAL",
          },
        }),
      },
    );

    if (!response.FinancialYear) {
      throw new Error("Failed to create financial year - no response");
    }

    this.createdYearsCache.add(targetYear);
    // Invalidate caches so next fetch gets updated data
    this.financialYearsCache = null;
    this.verifiedDatesCache.clear();

    logger.info("Financial year created successfully", {
      provider: "fortnox",
      targetYear,
      id: response.FinancialYear.Id,
    });
  }

  /**
   * Ensure a financial year exists for the given date, creating it if necessary
   * Note: Fortnox only allows creating years FORWARD from the latest existing year.
   * Years before the earliest existing year must be created manually in Fortnox.
   * See: https://www.fortnox.se/developer/guides-and-good-to-know/best-practices/vouchers
   */
  private async ensureFinancialYearExists(date: string): Promise<void> {
    // First check if year already exists for this date
    const hasYear = await this.hasFinancialYearForDate(date);
    if (hasYear) {
      return;
    }

    const targetYear = parseISO(date).getFullYear();
    logger.info("Financial year not found, will create it", {
      provider: "fortnox",
      date,
      targetYear,
    });

    // Get all existing financial years to determine pattern and range
    const existingYears = await this.getAllFinancialYears();
    const pattern = this.getPeriodPattern(existingYears);

    logger.info("Financial year pattern determined", {
      provider: "fortnox",
      pattern,
      existingYearsCount: existingYears.length,
    });

    // If no existing years, we cannot create via API
    // Fortnox requires at least one year to exist as a reference
    if (existingYears.length === 0) {
      throw new AccountingOperationError({
        type: "financial_year_setup_required",
        code: ACCOUNTING_ERROR_CODES.FINANCIAL_YEAR_SETUP_REQUIRED,
        message:
          "No fiscal years exist in Fortnox. Please create the first fiscal year manually in Fortnox before exporting.",
        retryable: false,
        metadata: {
          year: targetYear,
          provider: "fortnox",
        },
      });
    }

    // Get sorted list of existing year numbers
    const existingYearNumbers = existingYears
      .filter((y) => y.FromDate)
      .map((y) => new Date(y.FromDate!).getFullYear())
      .sort((a, b) => a - b);

    if (existingYearNumbers.length === 0) {
      throw new AccountingOperationError({
        type: "financial_year_setup_required",
        code: ACCOUNTING_ERROR_CODES.FINANCIAL_YEAR_SETUP_REQUIRED,
        message:
          "No valid fiscal years found in Fortnox. Please check your Fortnox fiscal year settings.",
        retryable: false,
        metadata: {
          year: targetYear,
          provider: "fortnox",
        },
      });
    }

    const earliestYear = existingYearNumbers[0]!;
    const latestYear = existingYearNumbers[existingYearNumbers.length - 1]!;

    // Fortnox only allows creating years FORWARD from the latest year
    // Years before the earliest must be created manually
    if (targetYear < earliestYear) {
      throw new AccountingOperationError({
        type: "financial_year_missing",
        code: ACCOUNTING_ERROR_CODES.FINANCIAL_YEAR_MISSING,
        message: `The fiscal year ${targetYear} does not exist in Fortnox. Please create it manually in Fortnox (Settings → Fiscal Years) before exporting transactions from this year.`,
        retryable: false,
        metadata: {
          year: targetYear,
          earliestYear,
          provider: "fortnox",
        },
      });
    }

    if (targetYear > latestYear) {
      // Going forwards: create from (latest+1) up to targetYear
      logger.info("Creating financial years forwards", {
        provider: "fortnox",
        from: latestYear + 1,
        to: targetYear,
      });
      for (let year = latestYear + 1; year <= targetYear; year++) {
        await this.createSingleFinancialYear(year, pattern);
      }
    }
  }

  // ============================================================================
  // Voucher Methods
  // ============================================================================

  /**
   * Create a voucher in Fortnox for a transaction
   *
   * Voucher structure:
   * - Expense (negative): Credit bank (e.g., 1930), Debit expense (e.g., 4000)
   * - Income (positive): Debit bank (e.g., 1930), Credit income (e.g., 3000)
   *
   * Automatically creates missing financial years if needed.
   * See: https://www.fortnox.se/developer/guides-and-good-to-know/best-practices/vouchers
   */
  private async createVoucher(
    tx: MappedTransaction,
    bankAccountCode: string,
  ): Promise<{ voucherId: string }> {
    // Ensure financial year exists, create if needed
    await this.ensureFinancialYearExists(tx.date);

    return this.withRetry(async () => {
      const isExpense = tx.amount < 0;
      const amount = Math.abs(tx.amount);

      // Determine contra account (expense or income)
      const defaultAccount = isExpense
        ? DEFAULT_EXPENSE_ACCOUNT
        : DEFAULT_INCOME_ACCOUNT;
      const contraAccount = this.getValidAccountCode(
        tx.categoryReportingCode,
        tx.id,
        defaultAccount,
      );

      // Build voucher rows for double-entry
      const voucherRows: FortnoxVoucherRow[] = isExpense
        ? [
            // Expense: Debit expense account, Credit bank account
            {
              Account: Number.parseInt(contraAccount, 10),
              Debit: amount,
              Credit: 0,
            },
            {
              Account: Number.parseInt(bankAccountCode, 10),
              Debit: 0,
              Credit: amount,
            },
          ]
        : [
            // Income: Debit bank account, Credit income account
            {
              Account: Number.parseInt(bankAccountCode, 10),
              Debit: amount,
              Credit: 0,
            },
            {
              Account: Number.parseInt(contraAccount, 10),
              Debit: 0,
              Credit: amount,
            },
          ];

      // Use the same description as shown in Midday
      const baseDescription =
        tx.description || tx.counterpartyName || "Transaction";

      // Append tax info to VoucherRow description (use compact format for Fortnox)
      // Fortnox description field has ~200 char limit
      const rowDescription = appendTaxInfoToDescription(
        tx.description || "",
        tx,
        { compact: true, maxLength: 200 },
      );

      // Build comments with tax info and user notes (visible in Fortnox UI comment box)
      const voucherComments = buildPrivateNote(tx);

      // Note: ReferenceNumber, Year, and ApprovalState are read-only in Fortnox API
      // Vouchers are created as posted/finalized entries (standard for accounting integrations)
      const response = await this.apiCall<FortnoxVoucherResponse>("/vouchers", {
        method: "POST",
        body: JSON.stringify({
          Voucher: {
            Description: baseDescription.substring(0, 200), // Fortnox limit
            // Comments field shows in Fortnox UI comment box - use for tax info and notes
            Comments: voucherComments || undefined,
            TransactionDate: tx.date,
            VoucherSeries: "A", // Standard voucher series
            VoucherRows: voucherRows.map((row) => ({
              Account: row.Account,
              Debit: row.Debit,
              Credit: row.Credit,
              Description: rowDescription || undefined,
              // Additional Fortnox-specific fields
              CostCenter: tx.costCenter || undefined,
              Project: tx.project || undefined,
              // TransactionInformation: WHO the transaction is with (max 100 chars)
              TransactionInformation:
                tx.counterpartyName?.substring(0, 100) || undefined,
            })),
          },
        }),
      });

      if (!response.Voucher?.VoucherNumber) {
        throw new Error(
          "Failed to create voucher - no voucher number returned",
        );
      }

      // Voucher ID in Fortnox is: Series + Number + Year
      const voucherId = `${response.Voucher.VoucherSeries}-${response.Voucher.VoucherNumber}-${response.Voucher.Year}`;

      return { voucherId };
    }, "createVoucher");
  }

  // ============================================================================
  // Attachment Methods
  // ============================================================================

  /**
   * Upload attachment to Fortnox and link to voucher
   *
   * Flow:
   * 1. Upload file to archive
   * 2. Create voucher file connection
   */
  async uploadAttachment(
    params: UploadAttachmentParams,
  ): Promise<AttachmentResult> {
    const { transactionId, fileName, mimeType, content } = params;

    // Ensure filename has proper extension based on mimeType
    const sanitizedFileName = ensureFileExtension(fileName, mimeType);

    logger.info("Starting Fortnox attachment upload", {
      provider: "fortnox",
      transactionId,
      fileName: sanitizedFileName,
      originalFileName: fileName !== sanitizedFileName ? fileName : undefined,
    });

    try {
      // Parse voucher ID (format: Series-Number-Year)
      const [voucherSeries, voucherNumber, voucherYear] =
        transactionId.split("-");
      if (!voucherSeries || !voucherNumber || !voucherYear) {
        logger.warn("Invalid Fortnox voucher ID format", {
          provider: "fortnox",
          transactionId,
          parsed: { voucherSeries, voucherNumber, voucherYear },
        });
        return {
          success: false,
          error: `Invalid voucher ID format: ${transactionId}. Expected: Series-Number-Year`,
        };
      }

      // Convert content to buffer
      const buffer = await streamToBuffer(content);

      // Step 1: Upload file to Inbox (vouchers folder)
      const fileId = await this.uploadFileToInbox(sanitizedFileName, buffer);

      // Step 2: Create voucher file connection
      // VoucherYear is required to uniquely identify the voucher
      await this.createVoucherFileConnection(
        fileId,
        voucherSeries,
        voucherNumber,
        voucherYear,
      );

      logger.info("Fortnox attachment uploaded successfully", {
        provider: "fortnox",
        transactionId,
        attachmentId: fileId,
      });

      return {
        success: true,
        attachmentId: fileId,
      };
    } catch (error) {
      const parsed = this.parseError(error);
      logger.error("Fortnox attachment upload failed", {
        provider: "fortnox",
        transactionId,
        fileName: sanitizedFileName,
        error: parsed.message,
      });
      return {
        success: false,
        error: parsed.message,
      };
    }
  }

  /**
   * Upload file to Fortnox Inbox
   * Upload to root inbox - Fortnox will handle the file location
   */
  private async uploadFileToInbox(
    fileName: string,
    content: Buffer,
  ): Promise<string> {
    return this.withRetry(async () => {
      // Upload to inbox root (no path parameter)
      const response = await this.uploadFile("/inbox", fileName, content);

      if (!response.File?.Id) {
        throw new Error("Failed to upload file - no file ID returned");
      }

      logger.info("File uploaded to inbox", {
        provider: "fortnox",
        fileId: response.File.Id,
        fileName: response.File.Name,
        path: response.File.Path,
      });

      return response.File.Id;
    }, "uploadFileToInbox");
  }

  /**
   * Create connection between file and voucher
   *
   * Per Fortnox API (discovered through testing):
   * - FileId: string (from inbox upload)
   * - VoucherSeries: string
   * - VoucherNumber: STRING (not integer!)
   * - VoucherYear: INTEGER (required, identifies fiscal year)
   */
  private async createVoucherFileConnection(
    fileId: string,
    voucherSeries: string,
    voucherNumber: string,
    voucherYear: string,
  ): Promise<void> {
    return this.withRetry(async () => {
      logger.info("Creating voucher file connection", {
        provider: "fortnox",
        fileId,
        voucherSeries,
        voucherNumber,
        voucherYear,
      });

      // Try without VoucherYear - Fortnox may derive it from voucher lookup
      // VoucherNumber as string per API examples
      await this.apiCall(
        `/voucherfileconnections?financialyear=${voucherYear}`,
        {
          method: "POST",
          body: JSON.stringify({
            VoucherFileConnection: {
              FileId: fileId,
              VoucherSeries: voucherSeries,
              VoucherNumber: voucherNumber, // String
            },
          }),
        },
      );
    }, "createVoucherFileConnection");
  }

  /**
   * Delete/unlink an attachment from a voucher
   *
   * Fortnox API: DELETE /voucherfileconnections/{FileId}
   */
  async deleteAttachment(
    params: DeleteAttachmentParams,
  ): Promise<DeleteAttachmentResult> {
    const { transactionId, attachmentId } = params;

    logger.info("Deleting Fortnox attachment", {
      provider: "fortnox",
      transactionId,
      attachmentId,
    });

    try {
      await this.withRetry(async () => {
        await this.apiCall(`/voucherfileconnections/${attachmentId}`, {
          method: "DELETE",
        });
      }, "deleteAttachment");

      logger.info("Fortnox attachment deleted successfully", {
        provider: "fortnox",
        transactionId,
        attachmentId,
      });

      return { success: true };
    } catch (error) {
      const parsed = this.parseError(error);
      logger.error("Fortnox attachment deletion failed", {
        provider: "fortnox",
        transactionId,
        attachmentId,
        error: parsed.message,
      });
      return {
        success: false,
        error: parsed.message,
      };
    }
  }
}
