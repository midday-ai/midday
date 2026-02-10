/// <reference path="../../../../types/intuit-oauth.d.ts" />
import { logger } from "@midday/logger";
import { parseISO } from "date-fns";
import OAuthClient from "intuit-oauth";
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
  type ProviderInitConfig,
  type QuickBooksProviderConfig,
  type RateLimitConfig,
  type SyncResult,
  type SyncTransactionsParams,
  type TokenSet,
  type UploadAttachmentParams,
} from "../types";
import {
  buildPrivateNote,
  ensureFileExtension,
  generateTransactionIdempotencyKey,
  streamToBuffer,
} from "../utils";

/**
 * QuickBooks OAuth scopes required for the integration
 */
export const QUICKBOOKS_SCOPES = [
  OAuthClient.scopes.Accounting,
  OAuthClient.scopes.OpenId,
];

/** Default expense account for transactions without a category code */
const DEFAULT_EXPENSE_ACCOUNT = "Miscellaneous";

/** QuickBooks API base URLs */
const QB_API_BASE = {
  sandbox: "https://sandbox-quickbooks.api.intuit.com",
  production: "https://quickbooks.api.intuit.com",
};

/** Request timeout in milliseconds (30 seconds) */
const REQUEST_TIMEOUT_MS = 30_000;

/**
 * QuickBooks accounting provider implementation using official Intuit OAuth SDK
 */
export class QuickBooksProvider extends BaseAccountingProvider {
  readonly id: AccountingProviderId = "quickbooks";
  readonly name = "QuickBooks";

  /**
   * QuickBooks rate limit: 500 calls per minute
   * https://developer.intuit.com/app/developer/qbo/docs/learn/rest-api-features#rate-limits
   */
  protected override readonly rateLimitConfig: RateLimitConfig = {
    maxConcurrent: 10,
    callDelayMs: 1000,
    callsPerMinute: 500,
    retryDelayMs: 5_000, // Wait 5 seconds on rate limit (shorter than Xero)
    maxRetries: 3,
  };

  private client: OAuthClient;
  private environment: "sandbox" | "production";

  constructor(config: ProviderInitConfig) {
    super(config);

    // Determine environment from redirect URI or default to production
    this.environment =
      config.redirectUri.includes("localhost") ||
      config.redirectUri.includes("sandbox")
        ? "sandbox"
        : "production";

    this.client = new OAuthClient({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      environment: this.environment,
      redirectUri: config.redirectUri,
    });

    // If we have existing tokens, set them
    if (config.config) {
      const qbConfig = config.config as QuickBooksProviderConfig;
      this.client.setToken({
        access_token: qbConfig.accessToken,
        refresh_token: qbConfig.refreshToken,
        token_type: "Bearer",
        expires_in: 3600, // Default, will be updated on refresh
        x_refresh_token_expires_in: 8726400, // ~100 days
        realmId: qbConfig.realmId,
        createdAt: new Date(qbConfig.expiresAt).getTime() - 3600 * 1000, // Estimate creation time
      });
    }
  }

  /**
   * Get the QuickBooks config (type-narrowed)
   */
  private getQBConfig(): QuickBooksProviderConfig {
    if (!this.config.config) {
      throw new Error("QuickBooks not configured with tokens");
    }
    return this.config.config as QuickBooksProviderConfig;
  }

  /**
   * Get the API base URL for current environment
   */
  private getApiBaseUrl(): string {
    return QB_API_BASE[this.environment];
  }

  /**
   * Extract error message from QuickBooks API errors
   * QuickBooks returns: { Fault: { Error: [{ Message: "...", Detail: "..." }] } }
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
      // Check if message contains QuickBooks Fault JSON
      try {
        const parsed = JSON.parse(error.message);
        if (parsed?.Fault?.Error?.length) {
          const firstError = parsed.Fault.Error[0];
          const detail = firstError?.Detail ? ` - ${firstError.Detail}` : "";
          return `${firstError?.Message || "QuickBooks error"}${detail}`;
        }
      } catch {
        // Not JSON, return message
      }
      return error.message;
    }

    // Handle QuickBooks response objects
    if (error && typeof error === "object") {
      const err = error as Record<string, unknown>;

      // QuickBooks Fault structure
      const fault = err.Fault as Record<string, unknown> | undefined;
      if (fault?.Error && Array.isArray(fault.Error)) {
        const firstError = fault.Error[0] as
          | Record<string, unknown>
          | undefined;
        if (firstError) {
          const detail = firstError.Detail ? ` - ${firstError.Detail}` : "";
          return `${firstError.Message || "QuickBooks error"}${detail}`;
        }
      }

      // Direct message
      if (err.message) return String(err.message);
    }

    return "Unknown QuickBooks error";
  }

  /**
   * Parse QuickBooks-specific errors into standardized format
   */
  protected override parseError(error: unknown): AccountingError {
    // Check if it's already an AccountingOperationError with structured data
    if (error instanceof AccountingOperationError) {
      return error.toJSON();
    }

    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      // Check for rate limit error
      if (
        message.includes("429") ||
        message.includes("rate limit") ||
        message.includes("throttl")
      ) {
        logger.warn("QuickBooks rate limit hit", { provider: "quickbooks" });
        return {
          type: "rate_limit",
          code: ACCOUNTING_ERROR_CODES.RATE_LIMIT,
          message: "Rate limit exceeded. Please try again shortly.",
          providerCode: "429",
          retryable: true,
        };
      }

      // Check for auth errors
      if (
        message.includes("401") ||
        message.includes("unauthorized") ||
        message.includes("invalid_grant")
      ) {
        return {
          type: "auth_expired",
          code: ACCOUNTING_ERROR_CODES.AUTH_EXPIRED,
          message:
            "Authentication failed. Please reconnect your QuickBooks account.",
          providerCode: "401",
          retryable: false,
        };
      }

      // Check for validation errors
      if (
        message.includes("400") ||
        message.includes("validation") ||
        message.includes("invalid")
      ) {
        return {
          type: "validation",
          code: ACCOUNTING_ERROR_CODES.VALIDATION,
          message: `Validation error: ${error.message}`,
          providerCode: "400",
          retryable: false,
        };
      }

      // Try to extract QuickBooks-specific error details from JSON response
      try {
        const errorObj = JSON.parse(error.message);
        if (errorObj?.Fault?.Error?.length) {
          const firstError = errorObj.Fault.Error[0];
          const detail = firstError?.Detail ? ` - ${firstError.Detail}` : "";
          return {
            type: "unknown",
            code: ACCOUNTING_ERROR_CODES.UNKNOWN,
            message: `QuickBooks error: ${firstError?.Message || error.message}${detail}`,
            providerCode: firstError?.code,
            retryable: false,
          };
        }
      } catch {
        // Not JSON, continue with generic handling
      }

      // Check for server errors
      if (message.includes("5")) {
        return {
          type: "server_error",
          code: ACCOUNTING_ERROR_CODES.SERVER_ERROR,
          message: "QuickBooks server error. Please try again later.",
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
      message: "Unknown error occurred",
      retryable: false,
    };
  }

  /**
   * Get user-friendly error message from error
   */
  private getErrorMessage(error: unknown): string {
    return this.extractErrorMessage(error);
  }

  /**
   * Validate and return account name, throwing an error if invalid
   *
   * @throws AccountingOperationError if the account name is invalid
   */
  private getValidAccountName(
    categoryReportingCode: string | undefined,
    transactionId: string,
  ): string {
    // If no category reporting code provided, use default
    if (!categoryReportingCode) {
      return DEFAULT_EXPENSE_ACCOUNT;
    }

    // Valid account name is non-empty string after trimming
    const trimmed = categoryReportingCode.trim();
    const isValid = trimmed.length > 0;

    if (!isValid) {
      throw new AccountingOperationError({
        type: "invalid_account",
        code: ACCOUNTING_ERROR_CODES.INVALID_ACCOUNT,
        message: `Invalid account name '${categoryReportingCode}'. QuickBooks requires a non-empty account name.`,
        retryable: false,
        metadata: {
          transactionId,
          invalidCode: categoryReportingCode,
          expectedFormat: "non-empty string",
        },
      });
    }

    return trimmed;
  }

  /**
   * Ensure the client has valid tokens, refresh if needed
   * Returns the current access token
   */
  private async ensureValidToken(): Promise<string> {
    if (!this.client.isAccessTokenValid()) {
      const authResponse = await this.client.refresh();
      const newToken = authResponse.getToken();

      // Update internal config
      if (this.config.config) {
        const qbConfig = this.config.config as QuickBooksProviderConfig;
        qbConfig.accessToken = newToken.access_token;
        qbConfig.refreshToken = newToken.refresh_token;
        qbConfig.expiresAt = new Date(
          (newToken.createdAt || Date.now()) + newToken.expires_in * 1000,
        ).toISOString();
      }

      return newToken.access_token;
    }

    return this.getQBConfig().accessToken;
  }

  /**
   * Make an authenticated API call to QuickBooks
   * @param method HTTP method
   * @param endpoint API endpoint path
   * @param body Request body for POST/PUT
   * @param idempotencyKey Optional Request-Id header for idempotent operations
   */
  private async apiCall<T>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    endpoint: string,
    body?: Record<string, unknown>,
    idempotencyKey?: string,
  ): Promise<T> {
    await this.ensureValidToken();

    const qbConfig = this.getQBConfig();
    const url = `${this.getApiBaseUrl()}/v3/company/${qbConfig.realmId}${endpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    // Add idempotency key if provided (QuickBooks uses Request-Id header)
    if (idempotencyKey) {
      headers["Request-Id"] = idempotencyKey;
    }

    const response = await this.client.makeApiCall({
      url,
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const responseData = response.json;

    // Check for API errors in response
    if ((responseData as { Fault?: unknown }).Fault) {
      throw new Error(JSON.stringify(responseData));
    }

    return responseData as T;
  }

  /**
   * Upload a file to QuickBooks using multipart/form-data
   * This uses native fetch since the OAuth SDK doesn't support multipart uploads
   */
  private async uploadFile(
    entityType: "Purchase" | "Deposit" | "Bill" | "Invoice",
    entityId: string,
    fileName: string,
    mimeType: string,
    content: Buffer,
  ): Promise<{ Id: string } | null> {
    const accessToken = await this.ensureValidToken();
    const qbConfig = this.getQBConfig();

    const url = `${this.getApiBaseUrl()}/v3/company/${qbConfig.realmId}/upload`;

    // Create multipart form data
    // QuickBooks expects: file_content_0 (file) and optionally file_metadata_0 (JSON)
    const formData = new FormData();

    // Add the file content (copy to ArrayBuffer for Blob compatibility)
    const arrayBuffer = content.buffer.slice(
      content.byteOffset,
      content.byteOffset + content.byteLength,
    ) as ArrayBuffer;
    const blob = new Blob([arrayBuffer], { type: mimeType });
    formData.append("file_content_0", blob, fileName);

    // Add metadata to link the attachment to the transaction
    // Must be sent as application/json, not text/plain
    const metadata = {
      AttachableRef: [
        {
          EntityRef: {
            type: entityType,
            value: entityId,
          },
        },
      ],
      FileName: fileName,
      ContentType: mimeType,
    };
    const metadataBlob = new Blob([JSON.stringify(metadata)], {
      type: "application/json",
    });
    formData.append("file_metadata_0", metadataBlob);

    const response = await fetch(url, {
      method: "POST",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `QuickBooks upload failed (${response.status}): ${errorText}`,
      );
    }

    const result = (await response.json()) as {
      AttachableResponse?: Array<{
        Attachable?: { Id: string };
        Fault?: {
          Error?: Array<{ Message?: string; Detail?: string; code?: string }>;
          type?: string;
        };
      }>;
      Fault?: {
        Error?: Array<{ Message?: string; Detail?: string; code?: string }>;
        type?: string;
      };
    };

    // Check for top-level fault
    if (result.Fault?.Error?.length) {
      const firstError = result.Fault.Error[0];
      const errorMsg =
        firstError?.Detail || firstError?.Message || "Unknown upload error";
      throw new Error(`QuickBooks upload error: ${errorMsg}`);
    }

    // Check for errors in the response
    const attachableResponse = result.AttachableResponse?.[0];
    if (attachableResponse?.Fault?.Error?.length) {
      const firstError = attachableResponse.Fault.Error[0];
      const errorMsg =
        firstError?.Detail || firstError?.Message || "Unknown upload error";
      throw new Error(`QuickBooks upload error: ${errorMsg}`);
    }

    return attachableResponse?.Attachable || null;
  }

  /**
   * Determine the entity type for a transaction based on the stored reference
   * QuickBooks uses different entity types for different transaction types
   */
  private async getEntityTypeForTransaction(
    transactionId: string,
  ): Promise<"Purchase" | "Deposit" | null> {
    // Try to find as Purchase first (expenses)
    try {
      const purchase = await this.apiCall<{ Purchase?: { Id: string } }>(
        "GET",
        `/purchase/${transactionId}`,
      );
      if (purchase.Purchase?.Id) {
        return "Purchase";
      }
    } catch {
      // Not a Purchase, try Deposit
    }

    // Try Deposit (income)
    try {
      const deposit = await this.apiCall<{
        Deposit?: { Id: string };
      }>("GET", `/deposit/${transactionId}`);
      if (deposit.Deposit?.Id) {
        return "Deposit";
      }
    } catch {
      // Not found
    }

    return null;
  }

  /**
   * Build OAuth consent URL for QuickBooks authorization
   */
  async buildConsentUrl(state: string): Promise<string> {
    return this.client.authorizeUri({
      scope: QUICKBOOKS_SCOPES,
      state,
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(callbackUrl: string): Promise<TokenSet> {
    const authResponse = await this.client.createToken(callbackUrl);
    const token = authResponse.getToken();

    if (!token.access_token || !token.refresh_token) {
      throw new Error(
        "Invalid token response from QuickBooks. Missing required token fields.",
      );
    }

    // Calculate expiration time
    const createdAt = token.createdAt || Date.now();
    const expiresAt = new Date(createdAt + token.expires_in * 1000);

    return {
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt,
      tokenType: token.token_type || "Bearer",
      scope: QUICKBOOKS_SCOPES,
    };
  }

  /**
   * Refresh expired tokens
   */
  async refreshTokens(refreshToken: string): Promise<TokenSet> {
    logger.info("Refreshing QuickBooks tokens", { provider: "quickbooks" });

    try {
      const authResponse = await this.client.refreshUsingToken(refreshToken);
      const token = authResponse.getToken();

      if (!token.access_token || !token.refresh_token) {
        throw new Error(
          "Invalid token response from QuickBooks during refresh. Please reconnect your account.",
        );
      }

      const createdAt = token.createdAt || Date.now();
      const expiresAt = new Date(createdAt + token.expires_in * 1000);

      logger.info("QuickBooks tokens refreshed successfully", {
        provider: "quickbooks",
      });

      return {
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        expiresAt,
        tokenType: token.token_type || "Bearer",
        scope: QUICKBOOKS_SCOPES,
      };
    } catch (error) {
      logger.error("Failed to refresh QuickBooks tokens", {
        provider: "quickbooks",
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Check if the connection to QuickBooks is valid
   */
  async checkConnection(): Promise<{ connected: boolean; error?: string }> {
    try {
      await this.ensureValidToken();
      // Try to get company info as a health check
      const qbConfig = this.getQBConfig();
      await this.apiCall<unknown>("GET", `/companyinfo/${qbConfig.realmId}`);
      return { connected: true };
    } catch (error) {
      return {
        connected: false,
        error: this.getErrorMessage(error),
      };
    }
  }

  /**
   * Get bank accounts from QuickBooks
   */
  async getAccounts(_tenantId: string): Promise<AccountingAccount[]> {
    return this.withRetry(async () => {
      // Query for bank accounts
      const response = await this.apiCall<{
        QueryResponse: {
          Account?: Array<{
            Id: string;
            Name: string;
            AcctNum?: string;
            AccountType: string;
            CurrencyRef?: { value: string };
            Active: boolean;
          }>;
        };
      }>(
        "GET",
        `/query?query=${encodeURIComponent(
          "SELECT * FROM Account WHERE AccountType = 'Bank' AND Active = true",
        )}`,
      );

      const accounts = response.QueryResponse?.Account || [];

      return accounts.map((account) => ({
        id: account.Id,
        name: account.Name,
        code: account.AcctNum,
        type: account.AccountType,
        currency: account.CurrencyRef?.value,
        status: account.Active ? ("active" as const) : ("archived" as const),
      }));
    }, "Failed to get accounts from QuickBooks");
  }

  /**
   * Get expense accounts from QuickBooks
   */
  private async getExpenseAccounts(): Promise<AccountingAccount[]> {
    return this.withRetry(async () => {
      const response = await this.apiCall<{
        QueryResponse: {
          Account?: Array<{
            Id: string;
            Name: string;
            AcctNum?: string;
            AccountType: string;
            CurrencyRef?: { value: string };
            Active: boolean;
          }>;
        };
      }>(
        "GET",
        `/query?query=${encodeURIComponent(
          "SELECT * FROM Account WHERE AccountType = 'Expense' AND Active = true",
        )}`,
      );

      const accounts = response.QueryResponse?.Account || [];

      return accounts.map((account) => ({
        id: account.Id,
        name: account.Name,
        code: account.AcctNum,
        type: "expense" as const,
        currency: account.CurrencyRef?.value,
        status: account.Active ? ("active" as const) : ("archived" as const),
      }));
    }, "Failed to get expense accounts from QuickBooks");
  }

  /**
   * Get income accounts from QuickBooks
   */
  private async getIncomeAccounts(): Promise<AccountingAccount[]> {
    return this.withRetry(async () => {
      // Query for Income account types using IN operator
      const response = await this.apiCall<{
        QueryResponse: {
          Account?: Array<{
            Id: string;
            Name: string;
            AcctNum?: string;
            AccountType: string;
            CurrencyRef?: { value: string };
            Active: boolean;
          }>;
        };
      }>(
        "GET",
        `/query?query=${encodeURIComponent(
          "SELECT * FROM Account WHERE AccountType IN ('Income', 'Other Income') AND Active = true",
        )}`,
      );

      const accounts = response.QueryResponse?.Account || [];

      return accounts.map((account) => ({
        id: account.Id,
        name: account.Name,
        code: account.AcctNum,
        type: "income" as const,
        currency: account.CurrencyRef?.value,
        status: account.Active ? ("active" as const) : ("archived" as const),
      }));
    }, "Failed to get income accounts from QuickBooks");
  }

  /**
   * Get or create a default expense account
   * Tries to find "Uncategorized Expense" or similar, creates one if none exist
   */
  private async getOrCreateDefaultExpenseAccount(): Promise<{
    id: string;
    name: string;
  }> {
    const expenseAccounts = await this.getExpenseAccounts();

    // Try to find common default expense accounts
    const uncategorized = expenseAccounts.find(
      (a) =>
        a.name.toLowerCase().includes("uncategorized") ||
        a.name.toLowerCase().includes("miscellaneous") ||
        a.name.toLowerCase() === "other expenses",
    );
    if (uncategorized) {
      return { id: uncategorized.id, name: uncategorized.name };
    }

    // Return first expense account if any exist
    const first = expenseAccounts[0];
    if (first) {
      return { id: first.id, name: first.name };
    }

    // No expense accounts exist - create a default one
    logger.info("No expense accounts found in QuickBooks, creating default", {
      provider: "quickbooks",
    });

    return this.createDefaultExpenseAccount();
  }

  /**
   * Create a default expense account in QuickBooks
   */
  private async createDefaultExpenseAccount(): Promise<{
    id: string;
    name: string;
  }> {
    const accountName = "Midday Expenses";

    const response = await this.apiCall<{
      Account: { Id: string; Name: string };
    }>("POST", "/account", {
      Name: accountName,
      AccountType: "Expense",
      AccountSubType: "OtherMiscellaneousServiceCost",
    });

    logger.info("Created default expense account in QuickBooks", {
      provider: "quickbooks",
      accountId: response.Account.Id,
      accountName: response.Account.Name,
    });

    return { id: response.Account.Id, name: response.Account.Name };
  }

  /**
   * Get or create a default income account
   * Tries to find "Uncategorized Income" or similar, creates one if none exist
   */
  private async getOrCreateDefaultIncomeAccount(): Promise<{
    id: string;
    name: string;
  }> {
    const incomeAccounts = await this.getIncomeAccounts();

    // Try to find common default income accounts
    const uncategorized = incomeAccounts.find(
      (a) =>
        a.name.toLowerCase().includes("uncategorized") ||
        a.name.toLowerCase().includes("other income") ||
        a.name.toLowerCase() === "sales",
    );
    if (uncategorized) {
      return { id: uncategorized.id, name: uncategorized.name };
    }

    // Return first income account if any exist
    const first = incomeAccounts[0];
    if (first) {
      return { id: first.id, name: first.name };
    }

    // No income accounts exist - create a default one
    logger.info("No income accounts found in QuickBooks, creating default", {
      provider: "quickbooks",
    });

    return this.createDefaultIncomeAccount();
  }

  /**
   * Create a default income account in QuickBooks
   */
  private async createDefaultIncomeAccount(): Promise<{
    id: string;
    name: string;
  }> {
    const accountName = "Midday Income";

    const response = await this.apiCall<{
      Account: { Id: string; Name: string };
    }>("POST", "/account", {
      Name: accountName,
      AccountType: "Income",
      AccountSubType: "ServiceFeeIncome",
    });

    logger.info("Created default income account in QuickBooks", {
      provider: "quickbooks",
      accountId: response.Account.Id,
      accountName: response.Account.Name,
    });

    return { id: response.Account.Id, name: response.Account.Name };
  }

  /**
   * Sync transactions to QuickBooks
   * Uses Purchase for expenses and Deposit for income
   * Always creates new transactions - user can re-export to create updated versions
   */
  async syncTransactions(params: SyncTransactionsParams): Promise<SyncResult> {
    const { transactions, targetAccountId, tenantId, jobId } = params;

    // Sort by date ascending for consistent ordering
    // This ensures transactions appear in chronological order in QuickBooks
    const sortedTransactions = [...transactions].sort(
      (a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime(),
    );

    logger.info("Starting QuickBooks transaction sync", {
      provider: "quickbooks",
      transactionCount: sortedTransactions.length,
      targetAccountId,
    });

    // Get or create default accounts for categorization
    const [defaultExpenseAccount, defaultIncomeAccount, expenseAccounts] =
      await Promise.all([
        this.getOrCreateDefaultExpenseAccount(),
        this.getOrCreateDefaultIncomeAccount(),
        this.getExpenseAccounts(),
      ]);

    // Build a map of expense account names to IDs for category matching
    const expenseAccountNameToId = new Map<string, string>();
    for (const account of expenseAccounts) {
      expenseAccountNameToId.set(account.name.toLowerCase(), account.id);
    }

    const results: SyncResult["results"] = [];
    let syncedCount = 0;
    let failedCount = 0;

    // Process transactions individually (QuickBooks doesn't support batch creates for mixed types)
    for (const tx of sortedTransactions) {
      try {
        let providerTransactionId: string | undefined;

        // Job-based idempotency key: same job = same key (retry safe), new job = new key (re-export works)
        const idempotencyKey = generateTransactionIdempotencyKey(tx.id, jobId);

        // Use the same description as shown in Midday
        const description =
          tx.description || tx.counterpartyName || "Transaction";

        // Resolve expense account: try to match by category name, fall back to default
        const categoryName = this.getValidAccountName(
          tx.categoryReportingCode,
          tx.id,
        );
        const expenseAccountId =
          expenseAccountNameToId.get(categoryName.toLowerCase()) ||
          defaultExpenseAccount.id;

        if (tx.amount < 0) {
          // Expense transaction - create a Purchase
          const purchase: Record<string, unknown> = {
            PaymentType: "Cash",
            AccountRef: { value: targetAccountId },
            TotalAmt: Math.abs(tx.amount),
            TxnDate: tx.date,
            CurrencyRef: { value: tx.currency },
            Line: [
              {
                Amount: Math.abs(tx.amount),
                DetailType: "AccountBasedExpenseLineDetail",
                AccountBasedExpenseLineDetail: {
                  AccountRef: {
                    value: expenseAccountId,
                  },
                },
                Description: description,
              },
            ],
          };
          // Build PrivateNote with tax info and user notes
          const privateNote = buildPrivateNote(tx);
          if (privateNote) {
            purchase.PrivateNote = privateNote;
          }

          const result = await this.withRetry(
            () =>
              this.apiCall<{ Purchase: { Id: string } }>(
                "POST",
                "/purchase",
                purchase,
                idempotencyKey,
              ),
            `Failed to create purchase for transaction ${tx.id}`,
          );
          providerTransactionId = result.Purchase?.Id;
        } else {
          // Income transaction - create a Deposit (simpler than SalesReceipt, no Item required)
          const deposit: Record<string, unknown> = {
            DepositToAccountRef: { value: targetAccountId },
            TxnDate: tx.date,
            CurrencyRef: { value: tx.currency },
            Line: [
              {
                Amount: tx.amount,
                DetailType: "DepositLineDetail",
                DepositLineDetail: {
                  AccountRef: {
                    value: defaultIncomeAccount.id,
                  },
                },
                Description: description,
              },
            ],
          };
          // Build PrivateNote with tax info and user notes
          const privateNote = buildPrivateNote(tx);
          if (privateNote) {
            deposit.PrivateNote = privateNote;
          }

          const result = await this.withRetry(
            () =>
              this.apiCall<{ Deposit: { Id: string } }>(
                "POST",
                "/deposit",
                deposit,
                idempotencyKey,
              ),
            `Failed to create deposit for transaction ${tx.id}`,
          );
          providerTransactionId = result.Deposit?.Id;
        }

        if (providerTransactionId) {
          results.push({
            transactionId: tx.id,
            providerTransactionId,
            providerEntityType: tx.amount < 0 ? "Purchase" : "Deposit",
            success: true,
          });
          syncedCount++;
        } else {
          results.push({
            transactionId: tx.id,
            success: false,
            error: "Transaction created but no ID returned",
          });
          failedCount++;
        }
      } catch (error) {
        logger.error("QuickBooks transaction sync failed", {
          provider: "quickbooks",
          transactionId: tx.id,
          error: this.getErrorMessage(error),
        });
        results.push({
          transactionId: tx.id,
          success: false,
          error: this.getErrorMessage(error),
        });
        failedCount++;
      }
    }

    logger.info("QuickBooks transaction sync completed", {
      provider: "quickbooks",
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

  /**
   * Upload attachment to a QuickBooks transaction
   * Supports both Purchase (expenses) and Deposit (income) transactions
   */
  async uploadAttachment(
    params: UploadAttachmentParams,
  ): Promise<AttachmentResult> {
    const {
      transactionId,
      fileName,
      mimeType,
      content,
      entityType: providedEntityType,
    } = params;

    // Ensure filename has proper extension based on mimeType
    const sanitizedFileName = ensureFileExtension(fileName, mimeType);

    logger.info("Starting QuickBooks attachment upload", {
      provider: "quickbooks",
      transactionId,
      fileName: sanitizedFileName,
    });

    try {
      // Convert content to Buffer if it's a stream
      const buffer = await streamToBuffer(content);

      // Use provided entity type if available, otherwise look it up
      let entityType: "Purchase" | "Deposit" | null = null;
      if (
        providedEntityType === "Purchase" ||
        providedEntityType === "Deposit"
      ) {
        entityType = providedEntityType;
      } else {
        entityType = await this.getEntityTypeForTransaction(transactionId);
      }

      if (!entityType) {
        logger.warn("QuickBooks transaction not found for attachment", {
          provider: "quickbooks",
          transactionId,
        });
        return {
          success: false,
          error: `Transaction ${transactionId} not found in QuickBooks`,
        };
      }

      // Upload the file using multipart form
      const result = await this.withRetry(
        () =>
          this.uploadFile(
            entityType,
            transactionId,
            sanitizedFileName,
            mimeType,
            buffer,
          ),
        `Failed to upload attachment "${sanitizedFileName}"`,
      );

      if (result?.Id) {
        logger.info("QuickBooks attachment uploaded successfully", {
          provider: "quickbooks",
          transactionId,
          attachmentId: result.Id,
        });
        return {
          success: true,
          attachmentId: result.Id,
        };
      }

      logger.warn("QuickBooks attachment upload returned no ID", {
        provider: "quickbooks",
        transactionId,
        fileName: sanitizedFileName,
      });
      return {
        success: false,
        error: "Attachment upload succeeded but no ID was returned",
      };
    } catch (error) {
      logger.error("QuickBooks attachment upload failed", {
        provider: "quickbooks",
        transactionId,
        fileName: sanitizedFileName,
        error: this.getErrorMessage(error),
      });
      return {
        success: false,
        error: this.getErrorMessage(error),
      };
    }
  }

  /**
   * Delete an attachment from QuickBooks
   *
   * QuickBooks supports deleting attachables via the API.
   * DELETE /v3/company/{realmId}/attachable?operation=delete
   */
  async deleteAttachment(
    params: DeleteAttachmentParams,
  ): Promise<DeleteAttachmentResult> {
    const { transactionId, attachmentId } = params;

    logger.info("Deleting QuickBooks attachment", {
      provider: "quickbooks",
      transactionId,
      attachmentId,
    });

    try {
      // First, get the attachable to retrieve SyncToken
      const getResponse = await this.withRetry(
        () =>
          this.apiCall<{ Attachable: { SyncToken: string } }>(
            "GET",
            `/attachable/${attachmentId}`,
          ),
        "getAttachableForDelete",
      );

      const syncToken = getResponse?.Attachable?.SyncToken;
      if (!syncToken) {
        throw new Error(
          `Attachable ${attachmentId} not found or missing SyncToken`,
        );
      }

      // Delete the attachable
      await this.withRetry(
        () =>
          this.apiCall<unknown>("POST", "/attachable?operation=delete", {
            Id: attachmentId,
            SyncToken: syncToken,
          }),
        "deleteAttachable",
      );

      logger.info("QuickBooks attachment deleted successfully", {
        provider: "quickbooks",
        transactionId,
        attachmentId,
      });

      return { success: true };
    } catch (error) {
      logger.error("QuickBooks attachment deletion failed", {
        provider: "quickbooks",
        transactionId,
        attachmentId,
        error: this.getErrorMessage(error),
      });
      return {
        success: false,
        error: this.getErrorMessage(error),
      };
    }
  }

  /**
   * Get company/organization information
   */
  async getTenantInfo(
    tenantId: string,
  ): Promise<{ id: string; name: string; currency?: string }> {
    return this.withRetry(async () => {
      const response = await this.apiCall<{
        CompanyInfo: {
          CompanyName: string;
          Country?: string;
          HomeCurrency?: { value: string };
        };
      }>("GET", `/companyinfo/${tenantId}`);

      const company = response.CompanyInfo;

      if (!company) {
        throw new Error(`Company with realm ID "${tenantId}" not found`);
      }

      return {
        id: tenantId,
        name: company.CompanyName || "Unknown",
        currency: company.HomeCurrency?.value,
      };
    }, "Failed to get company info from QuickBooks");
  }

  /**
   * Get tenants (companies) - QuickBooks only has one company per connection
   */
  async getTenants(): Promise<
    Array<{ tenantId: string; tenantName: string; tenantType: string }>
  > {
    const qbConfig = this.getQBConfig();
    const info = await this.getTenantInfo(qbConfig.realmId);

    return [
      {
        tenantId: qbConfig.realmId,
        tenantName: info.name,
        tenantType: "COMPANY",
      },
    ];
  }

  /**
   * Revoke tokens and disconnect from QuickBooks
   * Uses the Intuit OAuth SDK's revoke method
   */
  async disconnect(): Promise<void> {
    try {
      await this.client.revoke();
    } catch {
      // Revocation might fail if tokens are already invalid
      // We still want to clear our local state
    }
    this.config.config = undefined;
  }
}
