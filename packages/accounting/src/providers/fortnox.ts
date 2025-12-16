import { logger } from "@midday/logger";
import {
  FortnoxApiClient,
  type FortnoxScope,
} from "@rantalainen/fortnox-api-client";
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

/**
 * Fortnox OAuth scopes required for the integration
 * See: https://www.fortnox.se/developer/guides-and-good-to-know/scopes
 */
export const FORTNOX_SCOPES: FortnoxScope[] = [
  "bookkeeping", // Read/write vouchers and accounts
  "companyinformation", // Read company info
  "archive", // Upload files
  "connectfile", // Connect files to vouchers
];

/** Default expense account code for Swedish BAS chart */
const DEFAULT_EXPENSE_ACCOUNT = "4000";
/** Default income account code for Swedish BAS chart */
const DEFAULT_INCOME_ACCOUNT = "3000";
/** Default bank account code for Swedish BAS chart */
const DEFAULT_BANK_ACCOUNT = "1930";

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

  private client: FortnoxApiClient | null = null;
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

  /**
   * Initialize the Fortnox client with current tokens
   */
  private getClient(): FortnoxApiClient {
    if (!this.client) {
      if (!this.accessToken) {
        throw new Error("Fortnox client not initialized - no access token");
      }
      this.client = new FortnoxApiClient({
        clientId: this.config.clientId,
        clientSecret: this.config.clientSecret,
        accessToken: this.accessToken,
        refreshToken: this.refreshTokenValue ?? undefined,
      });
    }
    return this.client;
  }

  /**
   * Reset client to force re-initialization with new tokens
   */
  private resetClient(): void {
    this.client = null;
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
    const authUrl = FortnoxApiClient.createAuthorizationUri(
      this.config.clientId,
      this.config.redirectUri,
      FORTNOX_SCOPES,
      state,
      "service", // Service integration type
    );
    return authUrl;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<TokenSet> {
    const tokens = await FortnoxApiClient.getTokensByAuthorizationCode(
      this.config.clientId,
      this.config.clientSecret,
      this.config.redirectUri,
      code,
    );

    if (!tokens.accessToken || !tokens.refreshToken) {
      throw new Error("Failed to get tokens from Fortnox");
    }

    // Store tokens locally
    this.accessToken = tokens.accessToken;
    this.refreshTokenValue = tokens.refreshToken;
    // Fortnox access tokens expire in 1 hour
    this.tokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
    this.resetClient();

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: this.tokenExpiresAt,
      tokenType: "Bearer",
      scope: FORTNOX_SCOPES as string[],
    };
  }

  /**
   * Refresh the access token using the refresh token
   */
  async refreshTokens(refreshToken: string): Promise<TokenSet> {
    logger.info("Refreshing Fortnox tokens", { provider: "fortnox" });

    try {
      // The FortnoxApiClient handles token refresh internally
      // We need to create a new client with the refresh token and call refreshTokens
      const tempClient = new FortnoxApiClient({
        clientId: this.config.clientId,
        clientSecret: this.config.clientSecret,
        refreshToken: refreshToken,
      });

      // The client has a refreshTokens method
      const newTokens = await tempClient.refreshTokens();

      if (!newTokens.accessToken) {
        throw new Error("Failed to refresh Fortnox tokens");
      }

      // Update local state
      this.accessToken = newTokens.accessToken;
      this.refreshTokenValue = newTokens.refreshToken ?? refreshToken;
      // Fortnox access tokens expire in 1 hour
      this.tokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
      this.resetClient();

      logger.info("Fortnox tokens refreshed successfully", {
        provider: "fortnox",
      });

      return {
        accessToken: this.accessToken,
        refreshToken: this.refreshTokenValue,
        expiresAt: this.tokenExpiresAt,
        tokenType: "Bearer",
        scope: FORTNOX_SCOPES as string[],
      };
    } catch (error) {
      logger.error("Failed to refresh Fortnox tokens", {
        provider: "fortnox",
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
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
    this.resetClient();
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
    const client = this.getClient();
    const response =
      await client.api.companyinformation.getCompanyInformationResource();
    const companyInfo = response.data;

    return {
      id:
        companyInfo.CompanyInformation?.DatabaseNumber?.toString() ?? "default",
      name: companyInfo.CompanyInformation?.CompanyName ?? "Unknown",
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
   */
  async getAccounts(_tenantId: string): Promise<AccountingAccount[]> {
    return this.withRetry(async () => {
      const client = this.getClient();
      const response = await client.api.accounts.listAccountsResource();
      const accountsData = response.data;

      if (!accountsData.Accounts) {
        return [];
      }

      // Filter for bank/cash accounts (typically 19xx in Swedish BAS chart)
      // Also include other liquid accounts the user might want to use
      type FortnoxAccount = NonNullable<typeof accountsData.Accounts>[number];
      return accountsData.Accounts.filter((account: FortnoxAccount) => {
        // Active accounts only
        if (!account.Active) return false;

        // Bank accounts are typically in 19xx range
        const accountNum = account.Number ?? 0;
        return (
          (accountNum >= 1900 && accountNum <= 1999) || // Bank accounts
          (accountNum >= 1600 && accountNum <= 1699)
        ); // Other receivables/cash
      }).map((account: FortnoxAccount) => ({
        id: account.Number?.toString() ?? "",
        name: account.Description ?? `Account ${account.Number}`,
        code: account.Number?.toString(),
        type: this.getAccountType(account.Number ?? 0),
        currency: "SEK", // Fortnox is primarily Swedish
        status: account.Active ? ("active" as const) : ("archived" as const),
      }));
    }, "getAccounts");
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
      const client = this.getClient();
      const isExpense = tx.amount < 0;
      const amount = Math.abs(tx.amount);

      // Determine contra account (expense or income)
      const contraAccount =
        tx.categoryReportingCode ??
        (isExpense ? DEFAULT_EXPENSE_ACCOUNT : DEFAULT_INCOME_ACCOUNT);

      // Get the year from the transaction date
      const transactionYear = new Date(tx.date).getFullYear();

      // Build voucher rows for double-entry
      const voucherRows = isExpense
        ? [
            // Expense: Debit expense account, Credit bank account
            { Account: Number.parseInt(contraAccount), Debit: amount },
            { Account: Number.parseInt(bankAccountCode), Credit: amount },
          ]
        : [
            // Income: Debit bank account, Credit income account
            { Account: Number.parseInt(bankAccountCode), Debit: amount },
            { Account: Number.parseInt(contraAccount), Credit: amount },
          ];

      // Generate idempotency reference (max 100 chars in Fortnox)
      const referenceNumber = `midday-${tx.id}`.substring(0, 100);

      // Create the voucher
      const response = await client.api.vouchers.createVouchersResource({
        Voucher: {
          Description:
            tx.description || tx.counterpartyName || "Transaction from Midday",
          TransactionDate: tx.date,
          VoucherSeries: "A", // Standard voucher series
          Year: transactionYear,
          ReferenceNumber: referenceNumber, // Idempotency key
          VoucherRows: voucherRows.map((row) => ({
            Account: row.Account,
            Debit: row.Debit ?? 0,
            Credit: row.Credit ?? 0,
            Description: tx.description || undefined,
          })),
        },
      });

      const voucherData = response.data;
      if (!voucherData.Voucher?.VoucherNumber) {
        throw new Error(
          "Failed to create voucher - no voucher number returned",
        );
      }

      // Voucher ID in Fortnox is: Series + Number + Year
      const voucherId = `${voucherData.Voucher.VoucherSeries}-${voucherData.Voucher.VoucherNumber}-${voucherData.Voucher.Year}`;

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

    logger.info("Starting Fortnox attachment upload", {
      provider: "fortnox",
      transactionId,
      fileName,
      mimeType,
    });

    try {
      // Parse voucher ID (format: Series-Number-Year)
      const [voucherSeries, voucherNumber, voucherYear] =
        transactionId.split("-");
      if (!voucherSeries || !voucherNumber || !voucherYear) {
        logger.warn("Invalid Fortnox voucher ID format", {
          provider: "fortnox",
          transactionId,
        });
        return {
          success: false,
          error: `Invalid voucher ID format: ${transactionId}`,
        };
      }

      // Convert content to buffer
      const buffer = await streamToBuffer(content);

      // Step 1: Upload file to archive
      const fileId = await this.uploadFileToArchive(fileName, buffer);

      // Step 2: Create voucher file connection
      await this.createVoucherFileConnection(
        fileId,
        voucherSeries,
        voucherNumber,
        Number.parseInt(voucherYear),
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
   * Upload file to Fortnox archive
   */
  private async uploadFileToArchive(
    _fileName: string,
    content: Buffer,
  ): Promise<string> {
    return this.withRetry(async () => {
      const client = this.getClient();

      // Fortnox API expects the file as an object
      // The client library handles multipart form data
      const response = await client.api.archive.uploadFile(
        { file: content as unknown as object },
        { path: "Midday" }, // Upload to Midday folder
      );

      const fileData = response.data;
      if (!fileData.File?.Id) {
        throw new Error("Failed to upload file - no file ID returned");
      }

      return fileData.File.Id;
    }, "uploadFileToArchive");
  }

  /**
   * Create connection between file and voucher
   */
  private async createVoucherFileConnection(
    fileId: string,
    voucherSeries: string,
    voucherNumber: string,
    voucherYear: number,
  ): Promise<void> {
    return this.withRetry(async () => {
      const client = this.getClient();

      await client.api.voucherfileconnections.createVoucherFileConnectionsResource(
        {
          VoucherFileConnection: {
            FileId: fileId,
            VoucherSeries: voucherSeries,
            VoucherNumber: voucherNumber,
            VoucherYear: voucherYear,
          },
        },
      );
    }, "createVoucherFileConnection");
  }
}
