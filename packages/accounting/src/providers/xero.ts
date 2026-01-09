import { logger } from "@midday/logger";
import { parseISO } from "date-fns";
import {
  Account,
  AccountType,
  BankTransaction,
  type CurrencyCode,
  type HistoryRecords,
  LineAmountTypes,
  XeroClient,
} from "xero-node";
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
  type RateLimitConfig,
  type SyncResult,
  type SyncTransactionsParams,
  type TokenSet,
  type UploadAttachmentParams,
} from "../types";
import {
  buildPrivateNote,
  ensureFileExtension,
  generateAttachmentIdempotencyKey,
  generateTransactionIdempotencyKey,
  streamToBuffer,
} from "../utils";

/**
 * Xero OAuth scopes required for the integration
 */
export const XERO_SCOPES = [
  "openid",
  "profile",
  "email",
  "accounting.transactions",
  "accounting.attachments",
  "accounting.settings",
  "accounting.contacts.read",
  "offline_access",
];

/** Default expense account code when category doesn't have a reporting code */
const DEFAULT_EXPENSE_CODE = "429"; // General Expenses (common in Xero)
/** Default income account code when category doesn't have a reporting code */
const DEFAULT_INCOME_CODE = "200"; // Sales (common in Xero)

/** Xero rate limits per tenant */
const XERO_MINUTE_LIMIT = 60;
// Jobs are spread via delays (see export-transactions.ts calculateAttachmentJobDelay)
// This concurrent limit is for multiple attachments within a single job
const XERO_CONCURRENT_LIMIT = 3;
const XERO_SAFE_THRESHOLD = 10; // Start slowing down when 10 calls remain

// Note: Transaction idempotency is handled by our sync records table.
// Attachment uploads use generateAttachmentIdempotencyKey() from utils.

/**
 * Xero accounting provider implementation
 * Includes adaptive rate limiting based on call tracking
 */
export class XeroProvider extends BaseAccountingProvider {
  readonly id: AccountingProviderId = "xero";
  readonly name = "Xero";

  /**
   * Xero rate limit: 60 calls per minute, 5 concurrent
   * https://developer.xero.com/documentation/guides/oauth2/limits
   */
  protected override readonly rateLimitConfig: RateLimitConfig = {
    callsPerMinute: XERO_MINUTE_LIMIT,
    maxConcurrent: XERO_CONCURRENT_LIMIT,
    callDelayMs: 1500, // 1.5s between batches of 3 = ~40 calls/min (safe margin)
    retryDelayMs: 60_000, // Wait 1 minute on rate limit
    maxRetries: 3,
  };

  private client: XeroClient;

  /**
   * Track API calls for adaptive rate limiting
   * Stores timestamps of recent calls to calculate remaining quota
   */
  private callTimestamps: number[] = [];

  constructor(config: ProviderInitConfig) {
    super(config);

    this.client = new XeroClient({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      redirectUris: [config.redirectUri],
      scopes: XERO_SCOPES,
      httpTimeout: 30000, // 30 seconds
    });
  }

  /**
   * Record an API call timestamp for rate limiting
   */
  private recordApiCall(): void {
    const now = Date.now();
    this.callTimestamps.push(now);

    // Clean up timestamps older than 1 minute
    const oneMinuteAgo = now - 60_000;
    this.callTimestamps = this.callTimestamps.filter((t) => t > oneMinuteAgo);
  }

  /**
   * Get remaining API calls in the current minute window
   */
  private getRemainingCalls(): number {
    const now = Date.now();
    const oneMinuteAgo = now - 60_000;

    // Count calls in the last minute
    const recentCalls = this.callTimestamps.filter((t) => t > oneMinuteAgo);
    return Math.max(0, XERO_MINUTE_LIMIT - recentCalls.length);
  }

  /**
   * Apply adaptive delay based on remaining quota
   * Slows down when approaching rate limit
   */
  private async applyAdaptiveDelay(): Promise<void> {
    const remaining = this.getRemainingCalls();

    if (remaining <= 0) {
      // At limit - wait for oldest call to expire
      const oldestCall = this.callTimestamps[0];
      if (oldestCall) {
        const waitTime = 60_000 - (Date.now() - oldestCall) + 100; // +100ms buffer
        if (waitTime > 0) {
          logger.info("Xero rate limit reached, waiting", {
            provider: "xero",
            waitMs: waitTime,
          });
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
    } else if (remaining <= XERO_SAFE_THRESHOLD) {
      // Approaching limit - add increasing delay
      const delayMs = Math.round(
        (1000 * (XERO_SAFE_THRESHOLD - remaining)) / XERO_SAFE_THRESHOLD,
      );
      if (delayMs > 0) {
        logger.debug("Xero adaptive delay applied", {
          provider: "xero",
          remaining,
          delayMs,
        });
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
    // Plenty of quota - no delay needed
  }

  /**
   * Override withRetry to include adaptive rate limiting
   */
  protected override async withRetry<T>(
    operation: () => Promise<T>,
    context: string,
  ): Promise<T> {
    // Apply adaptive delay before the call
    await this.applyAdaptiveDelay();

    // Record the call
    this.recordApiCall();

    // Delegate to base implementation
    return super.withRetry(operation, context);
  }

  /**
   * Parse Xero-specific errors into standardized format
   */
  protected override parseError(error: unknown): AccountingError {
    // Check if it's already an AccountingOperationError with structured data
    if (error instanceof AccountingOperationError) {
      return error.toJSON();
    }

    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      // Check for rate limit error
      if (message.includes("429") || message.includes("rate limit")) {
        logger.warn("Xero rate limit hit", { provider: "xero" });
        return {
          type: "rate_limit",
          code: ACCOUNTING_ERROR_CODES.RATE_LIMIT,
          message: "Rate limit exceeded. Please try again in a minute.",
          providerCode: "429",
          retryable: true,
        };
      }

      // Check for auth errors
      if (message.includes("401") || message.includes("unauthorized")) {
        return {
          type: "auth_expired",
          code: ACCOUNTING_ERROR_CODES.AUTH_EXPIRED,
          message: "Authentication failed. Please reconnect your Xero account.",
          providerCode: "401",
          retryable: false,
        };
      }

      // Check for validation errors
      if (message.includes("400")) {
        return {
          type: "validation",
          code: ACCOUNTING_ERROR_CODES.VALIDATION,
          message: `Validation error: ${error.message}`,
          providerCode: "400",
          retryable: false,
        };
      }

      // Try to extract Xero-specific error details
      const xeroError = error as {
        response?: { body?: { Message?: string; Detail?: string } };
      };
      if (xeroError.response?.body?.Message) {
        const detail = xeroError.response.body.Detail
          ? ` - ${xeroError.response.body.Detail}`
          : "";
        return {
          type: "unknown",
          code: ACCOUNTING_ERROR_CODES.UNKNOWN,
          message: `Xero error: ${xeroError.response.body.Message}${detail}`,
          retryable: false,
        };
      }

      // Check for server errors
      if (message.includes("5")) {
        return {
          type: "server_error",
          code: ACCOUNTING_ERROR_CODES.SERVER_ERROR,
          message: "Xero server error. Please try again later.",
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
   * Extract error message from Xero SDK errors
   * Xero SDK throws various formats: stringified JSON, Error objects, response objects
   */
  protected override extractErrorMessage(error: unknown): string {
    // Handle stringified JSON (Xero SDK often throws these)
    if (typeof error === "string") {
      try {
        const parsed = JSON.parse(error);
        return this.extractErrorMessage(parsed);
      } catch {
        // Not JSON, return string if reasonable length
        return error.length < 500 ? error : "Error response too long";
      }
    }

    // Handle Error objects
    if (error instanceof Error) {
      // Check if message itself is JSON
      try {
        const parsed = JSON.parse(error.message);
        return this.extractErrorMessage(parsed);
      } catch {
        return error.message;
      }
    }

    // Handle Xero response objects
    if (error && typeof error === "object") {
      const err = error as Record<string, unknown>;

      // Extract from response.body (Xero SDK pattern)
      const response = err.response as Record<string, unknown> | undefined;
      const body = (response?.body ?? err.body) as
        | Record<string, unknown>
        | undefined;

      if (body) {
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

        // Standard Xero error fields
        if (body.Detail) return String(body.Detail);
        if (body.Title) return String(body.Title);
        if (body.Message) return String(body.Message);
        if (body.message) return String(body.message);
      }

      // HTTP status code
      const statusCode = response?.statusCode ?? err.statusCode;
      if (statusCode) {
        return `API error (HTTP ${statusCode})`;
      }

      // Direct message property
      if (err.message) return String(err.message);
    }

    return "Unknown Xero error";
  }

  /** Convenience method for error extraction */
  private getErrorMessage(error: unknown): string {
    return this.extractErrorMessage(error);
  }

  /**
   * Validate and return account code, throwing an error if invalid
   * Uses different defaults for expenses vs income when no code is provided
   *
   * @throws AccountingOperationError if the code is invalid format
   */
  private getValidAccountCode(
    categoryReportingCode: string | undefined,
    transactionId: string,
    isExpense: boolean,
  ): string {
    const defaultCode = isExpense ? DEFAULT_EXPENSE_CODE : DEFAULT_INCOME_CODE;

    // If no category reporting code provided, use default
    if (!categoryReportingCode) {
      return defaultCode;
    }

    // Valid Xero account codes are non-empty alphanumeric strings
    const isValid = /^[a-zA-Z0-9]+$/.test(categoryReportingCode);

    if (!isValid) {
      throw new AccountingOperationError({
        type: "invalid_account",
        code: ACCOUNTING_ERROR_CODES.INVALID_ACCOUNT,
        message: `Invalid account code '${categoryReportingCode}'. Xero requires alphanumeric account codes (e.g., 200, 429).`,
        retryable: false,
        metadata: {
          transactionId,
          invalidCode: categoryReportingCode,
          expectedFormat: "alphanumeric",
        },
      });
    }

    return categoryReportingCode;
  }

  /**
   * Map a MappedTransaction to a Xero BankTransaction object
   * This method may throw AccountingOperationError for invalid account codes
   */
  private mapToBankTransaction(tx: MappedTransaction, targetAccountId: string) {
    const isExpense = tx.amount < 0;

    return {
      type: isExpense
        ? BankTransaction.TypeEnum.SPEND
        : BankTransaction.TypeEnum.RECEIVE,
      // Bank transactions are gross amounts (tax-inclusive)
      // Let Xero calculate tax using the account's default tax rate
      lineAmountTypes: LineAmountTypes.Inclusive,
      contact: tx.counterpartyName
        ? {
            name: tx.counterpartyName,
          }
        : undefined,
      lineItems: [
        {
          // Clean description - tax info goes in History & Notes
          description: tx.description,
          quantity: 1,
          unitAmount: Math.abs(tx.amount),
          // Use category's reporting code if valid, otherwise default based on type
          accountCode: this.getValidAccountCode(
            tx.categoryReportingCode,
            tx.id,
            isExpense,
          ),
        },
      ],
      bankAccount: {
        accountID: targetAccountId,
      },
      date: tx.date,
      reference: tx.reference || tx.id,
      currencyCode: tx.currency as unknown as CurrencyCode,
    };
  }

  /**
   * Ensure the Xero client is ready with valid tokens
   * Extracts common token setup logic used across all API methods
   */
  private async ensureClientReady(): Promise<void> {
    const accessToken = await this.getValidAccessToken();

    await this.client.setTokenSet({
      access_token: accessToken,
      refresh_token: this.config.config?.refreshToken,
      expires_at: Math.floor(
        new Date(this.config.config?.expiresAt || Date.now()).getTime() / 1000,
      ),
      token_type: "Bearer",
    });
  }

  /**
   * Build OAuth consent URL for Xero authorization
   */
  async buildConsentUrl(state: string): Promise<string> {
    await this.client.initialize();
    const consentUrl = await this.client.buildConsentUrl();

    // Append our encrypted state parameter
    const url = new URL(consentUrl);
    url.searchParams.set("state", state);

    return url.toString();
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(callbackUrl: string): Promise<TokenSet> {
    // Extract state from callback URL - needed for XeroClient verification
    const url = new URL(callbackUrl);
    const state = url.searchParams.get("state");

    // Create a new client with the state set for verification
    // XeroClient stores state in config and verifies it during apiCallback
    const callbackClient = new XeroClient({
      clientId: this.config.clientId,
      clientSecret: this.config.clientSecret,
      redirectUris: [this.config.redirectUri],
      scopes: XERO_SCOPES,
      httpTimeout: 30000,
      state: state || undefined,
    });

    await callbackClient.initialize();
    const tokenSet = await callbackClient.apiCallback(callbackUrl);

    // Get tenant information
    await callbackClient.updateTenants();
    const tenant = callbackClient.tenants[0];

    if (!tenant) {
      throw new Error(
        "No Xero organization found. Please ensure you have at least one organization in Xero.",
      );
    }

    if (
      !tokenSet.access_token ||
      !tokenSet.refresh_token ||
      !tokenSet.expires_at
    ) {
      throw new Error(
        "Invalid token response from Xero. Missing required token fields.",
      );
    }

    return {
      accessToken: tokenSet.access_token,
      refreshToken: tokenSet.refresh_token,
      expiresAt: new Date(tokenSet.expires_at * 1000),
      tokenType: tokenSet.token_type || "Bearer",
      scope: tokenSet.scope?.split(" "),
      // Include tenant info so callback doesn't need to call getTenants separately
      tenantId: tenant.tenantId,
      tenantName: tenant.tenantName,
    };
  }

  /**
   * Refresh expired tokens
   */
  async refreshTokens(refreshToken: string): Promise<TokenSet> {
    logger.info("Refreshing Xero tokens", { provider: "xero" });

    try {
      const tokenSet = await this.client.refreshWithRefreshToken(
        this.config.clientId,
        this.config.clientSecret,
        refreshToken,
      );

      if (
        !tokenSet.access_token ||
        !tokenSet.refresh_token ||
        !tokenSet.expires_at
      ) {
        throw new Error(
          "Invalid token response from Xero during refresh. Please reconnect your account.",
        );
      }

      logger.info("Xero tokens refreshed successfully", { provider: "xero" });

      return {
        accessToken: tokenSet.access_token,
        refreshToken: tokenSet.refresh_token,
        expiresAt: new Date(tokenSet.expires_at * 1000),
        tokenType: tokenSet.token_type || "Bearer",
        scope: tokenSet.scope?.split(" "),
      };
    } catch (error) {
      logger.error("Failed to refresh Xero tokens", {
        provider: "xero",
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Check if the connection to Xero is valid
   */
  async checkConnection(): Promise<{ connected: boolean; error?: string }> {
    try {
      await this.ensureClientReady();
      await this.client.updateTenants();

      if (this.client.tenants.length === 0) {
        return {
          connected: false,
          error: "No Xero organizations found",
        };
      }

      return { connected: true };
    } catch (error) {
      return {
        connected: false,
        error: this.getErrorMessage(error),
      };
    }
  }

  /**
   * Get bank accounts from Xero
   * Creates a default bank account if none exist
   */
  async getAccounts(tenantId: string): Promise<AccountingAccount[]> {
    await this.ensureClientReady();

    return this.withRetry(async () => {
      const response = await this.client.accountingApi.getAccounts(
        tenantId,
        undefined, // ifModifiedSince
        'Type=="BANK"', // Only bank accounts
      );

      const accounts = response.body.accounts || [];

      // Filter for active accounts
      const activeAccounts = accounts.filter(
        (account) => account.status === Account.StatusEnum.ACTIVE,
      );

      // If no active bank accounts, create a default one
      if (activeAccounts.length === 0) {
        logger.info("No active bank accounts found in Xero, creating default", {
          provider: "xero",
          tenantId,
        });

        const defaultAccount = await this.createDefaultBankAccount(tenantId);
        if (defaultAccount) {
          return [defaultAccount];
        }

        // If creation failed, return all accounts (including inactive)
        logger.warn(
          "Failed to create default bank account, returning all accounts",
          { provider: "xero" },
        );
      }

      return accounts.map((account) => ({
        id: account.accountID!,
        name: account.name!,
        code: account.code,
        type: account.type?.toString() || "BANK",
        currency: account.currencyCode?.toString(),
        status:
          account.status === Account.StatusEnum.ACTIVE ? "active" : "archived",
      }));
    }, "Failed to get accounts from Xero");
  }

  /**
   * Create a default bank account in Xero
   * Used when no bank accounts exist
   */
  private async createDefaultBankAccount(
    tenantId: string,
  ): Promise<AccountingAccount | null> {
    try {
      const account: Account = {
        name: "Business Account",
        code: "090",
        type: AccountType.BANK,
        bankAccountType: Account.BankAccountTypeEnum.BANK,
        bankAccountNumber: "000000000", // Placeholder - user can update in Xero
      };

      const response = await this.client.accountingApi.createAccount(
        tenantId,
        account,
      );

      const createdAccount = response.body.accounts?.[0];

      if (createdAccount) {
        logger.info("Created default bank account in Xero", {
          provider: "xero",
          accountId: createdAccount.accountID,
          accountName: createdAccount.name,
        });

        return {
          id: createdAccount.accountID!,
          name: createdAccount.name!,
          code: createdAccount.code,
          type: "BANK",
          currency: createdAccount.currencyCode?.toString(),
          status: "active",
        };
      }

      return null;
    } catch (error) {
      logger.error("Failed to create default bank account in Xero", {
        provider: "xero",
        error: this.getErrorMessage(error),
      });
      return null;
    }
  }

  /**
   * Sync transactions to Xero as bank transactions
   * Always creates new transactions - user can re-export to create updated versions
   */
  async syncTransactions(params: SyncTransactionsParams): Promise<SyncResult> {
    const { transactions, targetAccountId, tenantId, jobId } = params;

    // Sort by date ascending for clean transaction ordering in Xero
    // This ensures transactions appear in chronological order (better for auditing)
    const sortedTransactions = [...transactions].sort(
      (a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime(),
    );

    logger.info("Starting Xero transaction sync", {
      provider: "xero",
      transactionCount: sortedTransactions.length,
      targetAccountId,
      tenantId,
      jobId,
    });

    await this.ensureClientReady();

    const results: SyncResult["results"] = [];
    let syncedCount = 0;
    let failedCount = 0;

    // Process transactions in batches (Xero recommends max 50 per request)
    const BATCH_SIZE = 50;

    for (let i = 0; i < sortedTransactions.length; i += BATCH_SIZE) {
      const batch = sortedTransactions.slice(i, i + BATCH_SIZE);

      // Map transactions with validation, tracking any that fail validation
      const mappedResults: Array<{
        tx: MappedTransaction;
        bankTransaction?: BankTransaction;
        error?: string;
      }> = batch.map((tx: MappedTransaction) => {
        try {
          return {
            tx,
            bankTransaction: this.mapToBankTransaction(tx, targetAccountId),
          };
        } catch (error) {
          return {
            tx,
            error: this.getErrorMessage(error),
          };
        }
      });

      // Separate valid and failed transactions
      const validMappings = mappedResults.filter((r) => r.bankTransaction);
      const failedMappings = mappedResults.filter((r) => r.error);

      // Record validation failures immediately
      for (const failed of failedMappings) {
        results.push({
          transactionId: failed.tx.id,
          success: false,
          error: failed.error,
        });
        failedCount++;
      }

      // Skip API call if no valid transactions in this batch
      if (validMappings.length === 0) {
        continue;
      }

      const bankTransactions = validMappings.map((r) => r.bankTransaction!);
      const validBatch = validMappings.map((r) => r.tx);

      try {
        // Use job-based idempotency key:
        // - Same job retrying = same key = no duplicate (retry safe)
        // - New export job = new key = allows re-export after deletion
        const firstTx = validBatch[0];
        const idempotencyKey = firstTx
          ? generateTransactionIdempotencyKey(firstTx.id, jobId)
          : undefined;

        const response =
          await this.client.accountingApi.updateOrCreateBankTransactions(
            tenantId,
            { bankTransactions },
            undefined, // summarizeErrors
            undefined, // unitdp
            idempotencyKey,
          );

        const createdTransactions = response.body.bankTransactions || [];

        for (let j = 0; j < validBatch.length; j++) {
          const created = createdTransactions[j];
          const original = validBatch[j];

          if (created?.bankTransactionID) {
            results.push({
              transactionId: original!.id,
              providerTransactionId: created.bankTransactionID,
              providerEntityType: "BankTransaction",
              success: true,
            });
            syncedCount++;
          } else {
            // Check for validation errors in the response
            const validationErrors = created?.validationErrors;
            const errorMessage = validationErrors?.length
              ? validationErrors.map((e) => e.message).join(", ")
              : "Transaction not created - no ID returned";

            results.push({
              transactionId: original!.id,
              success: false,
              error: errorMessage,
            });
            failedCount++;
          }
        }
      } catch (error) {
        const errorMessage = this.getErrorMessage(error);

        // Log detailed error info
        logger.error("Xero batch sync failed", {
          provider: "xero",
          batchIndex: i,
          batchSize: validBatch.length,
          error: errorMessage,
          errorType: typeof error,
          errorName: error?.constructor?.name,
          rawMessage: error instanceof Error ? error.message : undefined,
          rawJson:
            error && typeof error === "object"
              ? JSON.stringify(error, null, 2).slice(0, 500)
              : undefined,
        });

        // Mark all transactions in batch as failed with descriptive error
        const batchError = `Batch ${Math.floor(i / 50) + 1} failed: ${errorMessage}`;
        for (const tx of validBatch) {
          results.push({
            transactionId: tx.id,
            success: false,
            error: batchError,
          });
          failedCount++;
        }
      }
    }

    logger.info("Xero transaction sync completed", {
      provider: "xero",
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
   * Add a history note to a bank transaction with tax info, user notes, and attachment summary
   * Called after attachments are uploaded for a clean timeline
   */
  async addTransactionHistoryNote(params: {
    tenantId: string;
    transactionId: string;
    taxAmount?: number;
    taxRate?: number;
    taxType?: string;
    note?: string;
  }): Promise<void> {
    const { tenantId, transactionId, taxAmount, taxRate, taxType, note } =
      params;

    await this.ensureClientReady();

    // Build note content
    const noteContent = buildPrivateNote(
      { taxAmount, taxRate, taxType, note },
      { maxLength: 4000 },
    );

    // Build parts for the history note
    const parts: string[] = ["Synced from Midday"];

    if (noteContent) {
      parts.push(noteContent);
    }

    // Only add history if there's meaningful content beyond "Synced from Midday"
    if (parts.length === 1 && !noteContent) {
      return;
    }

    try {
      const historyRecords: HistoryRecords = {
        historyRecords: [
          {
            details: parts.join("\n"),
          },
        ],
      };

      await this.client.accountingApi.createBankTransactionHistoryRecord(
        tenantId,
        transactionId,
        historyRecords,
      );

      logger.debug("Added history note to Xero transaction", {
        provider: "xero",
        transactionId,
      });
    } catch (error) {
      // Log but don't fail - history note is non-critical
      logger.warn("Failed to add history note to Xero transaction", {
        provider: "xero",
        transactionId,
        error: this.getErrorMessage(error),
      });
      throw error; // Re-throw for the caller to handle
    }
  }

  /**
   * Upload attachment to a Xero bank transaction
   */
  async uploadAttachment(
    params: UploadAttachmentParams,
  ): Promise<AttachmentResult> {
    const { tenantId, transactionId, fileName, mimeType, content } = params;

    // Ensure filename has proper extension based on mimeType
    const sanitizedFileName = ensureFileExtension(fileName, mimeType);

    logger.info("Starting Xero attachment upload", {
      provider: "xero",
      transactionId,
      fileName: sanitizedFileName,
      originalFileName: fileName,
      mimeType,
    });

    await this.ensureClientReady();

    try {
      // Convert content to Buffer if it's a stream
      const buffer = await streamToBuffer(content);

      const idempotencyKey = generateAttachmentIdempotencyKey(
        transactionId,
        sanitizedFileName,
      );

      // Call API directly without withRetry - processor handles retries
      // This gives us raw error details instead of wrapped "Unknown error"
      const response =
        await this.client.accountingApi.createBankTransactionAttachmentByFileName(
          tenantId,
          transactionId,
          sanitizedFileName,
          buffer,
          idempotencyKey,
          {
            headers: {
              "Content-Type": mimeType,
            },
          },
        );

      const attachments = response.body.attachments || [];
      const attachment = attachments[0];

      if (attachment?.attachmentID) {
        logger.info("Xero attachment uploaded successfully", {
          provider: "xero",
          transactionId,
          attachmentId: attachment.attachmentID,
        });
        return {
          success: true,
          attachmentId: attachment.attachmentID,
        };
      }

      logger.warn("Xero attachment upload returned no ID", {
        provider: "xero",
        transactionId,
        fileName,
      });
      return {
        success: false,
        error: "Attachment upload succeeded but no ID was returned",
      };
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);

      // Log detailed error info to diagnose issues
      logger.error("Xero attachment upload failed", {
        provider: "xero",
        transactionId,
        fileName: sanitizedFileName,
        error: errorMessage,
        // Raw error details for debugging
        errorType: typeof error,
        errorName: error?.constructor?.name,
        rawMessage: error instanceof Error ? error.message : undefined,
        rawJson:
          error && typeof error === "object"
            ? JSON.stringify(error, null, 2).slice(0, 500)
            : undefined,
      });

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Delete/unlink an attachment from a Xero bank transaction
   *
   * Note: Xero doesn't have a direct delete endpoint for attachments.
   * This is a no-op that returns success, as Xero attachments cannot be deleted via API.
   * The attachment remains in Xero but we update our tracking to reflect the removal.
   */
  async deleteAttachment(
    params: DeleteAttachmentParams,
  ): Promise<DeleteAttachmentResult> {
    const { transactionId, attachmentId } = params;

    logger.warn("Xero attachment deletion not supported via API", {
      provider: "xero",
      transactionId,
      attachmentId,
      message:
        "Xero does not support attachment deletion via API. Attachment remains in Xero.",
    });

    // Return success as we'll update our tracking, even though Xero keeps the file
    // This is the best we can do with Xero's API limitations
    return { success: true };
  }

  /**
   * Get tenant/organization information
   */
  async getTenantInfo(
    tenantId: string,
  ): Promise<{ id: string; name: string; currency?: string }> {
    await this.ensureClientReady();

    return this.withRetry(async () => {
      const response =
        await this.client.accountingApi.getOrganisations(tenantId);
      const org = response.body.organisations?.[0];

      if (!org) {
        throw new Error(`Organization with tenant ID "${tenantId}" not found`);
      }

      return {
        id: tenantId,
        name: org.name || "Unknown",
        currency: org.baseCurrency?.toString(),
      };
    }, "Failed to get organization info from Xero");
  }

  /**
   * Get tenants (organizations) connected to this Xero app
   */
  async getTenants(): Promise<
    Array<{ tenantId: string; tenantName: string; tenantType: string }>
  > {
    await this.ensureClientReady();

    await this.client.updateTenants();

    return this.client.tenants.map((tenant) => ({
      tenantId: tenant.tenantId,
      tenantName: tenant.tenantName || "Unknown",
      tenantType: tenant.tenantType || "ORGANISATION",
    }));
  }

  /**
   * Revoke tokens and disconnect from Xero
   * Note: Xero SDK doesn't have a built-in revoke method
   * Token revocation is typically done by removing the connection in the app
   */
  async disconnect(): Promise<void> {
    // Xero doesn't have a token revocation endpoint in the SDK
    // The recommended approach is to simply delete the stored tokens
    // and let them expire naturally
    // See: https://developer.xero.com/documentation/guides/oauth2/auth-flow#token-expiry
    this.config.config = undefined;
  }
}
