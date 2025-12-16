import { logger } from "@midday/logger";
import { BaseAccountingProvider } from "../provider";
import {
  type AccountingAccount,
  type AccountingError,
  type AccountingProviderId,
  type AttachmentResult,
  type MappedTransaction,
  type ProviderInitConfig,
  RATE_LIMITS,
  type RateLimitConfig,
  type SyncResult,
  type SyncTransactionsParams,
  type TokenSet,
  type UploadAttachmentParams,
} from "../types";
import { streamToBuffer } from "../utils";

// ============================================================================
// Fortnox Types
// ============================================================================

type FortnoxScope =
  | "bookkeeping"
  | "companyinformation"
  | "archive"
  | "connectfile"
  | "inbox";

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
];

/** Default expense account code for Swedish BAS chart */
const DEFAULT_EXPENSE_ACCOUNT = "4000";
/** Default income account code for Swedish BAS chart */
const DEFAULT_INCOME_ACCOUNT = "3000";

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
   * Parse Fortnox-specific errors into standardized format
   */
  protected override parseError(error: unknown): AccountingError {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      // Check for rate limit error
      if (message.includes("429") || message.includes("too many requests")) {
        logger.warn("Fortnox rate limit hit", { provider: "fortnox" });
        return {
          type: "rate_limit",
          message: "Rate limit exceeded. Please try again in a few seconds.",
          providerCode: "429",
          retryable: true,
        };
      }

      // Check for auth errors
      if (message.includes("401") || message.includes("unauthorized")) {
        return {
          type: "auth_expired",
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
          message: `Validation error: ${error.message}`,
          providerCode: "400",
          retryable: false,
        };
      }

      // Check for not found
      if (message.includes("404") || message.includes("not found")) {
        return {
          type: "not_found",
          message: error.message,
          providerCode: "404",
          retryable: false,
        };
      }

      // Server errors
      if (message.includes("500") || message.includes("internal server")) {
        return {
          type: "server_error",
          message: "Fortnox server error. Please try again later.",
          providerCode: "500",
          retryable: true,
        };
      }

      return {
        type: "unknown",
        message: error.message,
        retryable: false,
      };
    }

    return {
      type: "unknown",
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
      name: "Företagskonto (default)",
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
    const { transactions, targetAccountId, tenantId } = params;

    logger.info("Starting Fortnox transaction sync", {
      provider: "fortnox",
      transactionCount: transactions.length,
      targetAccountId,
      tenantId,
    });

    const results: SyncResult["results"] = [];
    let syncedCount = 0;
    let failedCount = 0;

    for (const tx of transactions) {
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
        });
        results.push({
          transactionId: tx.id,
          success: false,
          error: parsed.message,
        });
        failedCount++;
      }
    }

    logger.info("Fortnox transaction sync completed", {
      provider: "fortnox",
      syncedCount,
      failedCount,
      totalTransactions: transactions.length,
    });

    return {
      success: failedCount === 0,
      syncedCount,
      failedCount,
      results,
    };
  }

  /**
   * Create a voucher in Fortnox for a transaction
   *
   * Voucher structure:
   * - Expense (negative): Credit bank (e.g., 1930), Debit expense (e.g., 4000)
   * - Income (positive): Debit bank (e.g., 1930), Credit income (e.g., 3000)
   */
  private async createVoucher(
    tx: MappedTransaction,
    bankAccountCode: string,
  ): Promise<{ voucherId: string }> {
    return this.withRetry(async () => {
      const isExpense = tx.amount < 0;
      const amount = Math.abs(tx.amount);

      // Determine contra account (expense or income)
      const contraAccount =
        tx.categoryReportingCode ??
        (isExpense ? DEFAULT_EXPENSE_ACCOUNT : DEFAULT_INCOME_ACCOUNT);

      // Get the year from the transaction date
      const transactionYear = new Date(tx.date).getFullYear();

      // Build voucher rows for double-entry
      const voucherRows: FortnoxVoucherRow[] = isExpense
        ? [
            // Expense: Debit expense account, Credit bank account
            {
              Account: Number.parseInt(contraAccount),
              Debit: amount,
              Credit: 0,
            },
            {
              Account: Number.parseInt(bankAccountCode),
              Debit: 0,
              Credit: amount,
            },
          ]
        : [
            // Income: Debit bank account, Credit income account
            {
              Account: Number.parseInt(bankAccountCode),
              Debit: amount,
              Credit: 0,
            },
            {
              Account: Number.parseInt(contraAccount),
              Debit: 0,
              Credit: amount,
            },
          ];

      // Build description with Midday reference for tracking
      const description =
        tx.description || tx.counterpartyName || "Transaction";
      const voucherDescription = `${description} (midday:${tx.id.substring(0, 8)})`;

      // Note: ReferenceNumber, Year, and ApprovalState are read-only in Fortnox API
      // Vouchers are created as drafts by default
      const response = await this.apiCall<FortnoxVoucherResponse>("/vouchers", {
        method: "POST",
        body: JSON.stringify({
          Voucher: {
            Description: voucherDescription.substring(0, 200), // Fortnox limit
            TransactionDate: tx.date,
            VoucherSeries: "A", // Standard voucher series
            VoucherRows: voucherRows.map((row) => ({
              Account: row.Account,
              Debit: row.Debit,
              Credit: row.Credit,
              Description: tx.description || undefined,
              // Additional Fortnox-specific fields
              CostCenter: tx.costCenter || undefined,
              Project: tx.project || undefined,
              // TransactionInformation: Additional text (max 100 chars)
              TransactionInformation:
                tx.reference?.substring(0, 100) || undefined,
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
    const { transactionId, fileName, content } = params;

    logger.info("Starting Fortnox attachment upload", {
      provider: "fortnox",
      transactionId,
      fileName,
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
      const fileId = await this.uploadFileToInbox(fileName, buffer);

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
        fileName,
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
}
