import { logger } from "@midday/logger";
import {
  Account,
  BankTransaction,
  type CurrencyCode,
  XeroClient,
} from "xero-node";
import { BaseAccountingProvider } from "../provider";
import type {
  AccountingAccount,
  AccountingError,
  AccountingProviderId,
  AttachmentResult,
  MappedTransaction,
  ProviderInitConfig,
  RateLimitConfig,
  SyncResult,
  SyncTransactionsParams,
  TokenSet,
  UploadAttachmentParams,
} from "../types";
import { streamToBuffer } from "../utils";

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

/** Default account code when category doesn't have a reporting code */
const DEFAULT_ACCOUNT_CODE = "400";

/**
 * Generate deterministic idempotency key for a transaction
 */
function generateIdempotencyKey(transactionId: string, date: string): string {
  return `midday-${transactionId}-${date}`;
}

/**
 * Xero accounting provider implementation
 */
export class XeroProvider extends BaseAccountingProvider {
  readonly id: AccountingProviderId = "xero";
  readonly name = "Xero";

  /**
   * Xero rate limit: 60 calls per minute
   * https://developer.xero.com/documentation/guides/oauth2/limits
   */
  protected override readonly rateLimitConfig: RateLimitConfig = {
    callsPerMinute: 60,
    retryDelayMs: 60_000, // Wait 1 minute on rate limit
    maxRetries: 3,
  };

  private client: XeroClient;

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
   * Parse Xero-specific errors into standardized format
   */
  protected override parseError(error: unknown): AccountingError {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      // Check for rate limit error
      if (message.includes("429") || message.includes("rate limit")) {
        logger.warn("Xero rate limit hit", { provider: "xero" });
        return {
          type: "rate_limit",
          message: "Rate limit exceeded. Please try again in a minute.",
          providerCode: "429",
          retryable: true,
        };
      }

      // Check for auth errors
      if (message.includes("401") || message.includes("unauthorized")) {
        return {
          type: "auth_expired",
          message: "Authentication failed. Please reconnect your Xero account.",
          providerCode: "401",
          retryable: false,
        };
      }

      // Check for validation errors
      if (message.includes("400")) {
        return {
          type: "validation",
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
          message: `Xero error: ${xeroError.response.body.Message}${detail}`,
          retryable: false,
        };
      }

      // Check for server errors
      if (message.includes("5")) {
        return {
          type: "server_error",
          message: "Xero server error. Please try again later.",
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
      message: "Unknown error occurred",
      retryable: false,
    };
  }

  /**
   * Get user-friendly error message from error
   */
  private getErrorMessage(error: unknown): string {
    return this.parseError(error).message;
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
    await this.client.initialize();
    const tokenSet = await this.client.apiCallback(callbackUrl);

    // Get tenant information
    await this.client.updateTenants();
    const tenant = this.client.tenants[0];

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
   * Sync transactions to Xero as bank transactions
   */
  async syncTransactions(params: SyncTransactionsParams): Promise<SyncResult> {
    const { transactions, targetAccountId, tenantId } = params;

    logger.info("Starting Xero transaction sync", {
      provider: "xero",
      transactionCount: transactions.length,
      targetAccountId,
      tenantId,
    });

    await this.ensureClientReady();

    const results: SyncResult["results"] = [];
    let syncedCount = 0;
    let failedCount = 0;

    // Process transactions in batches (Xero recommends max 50 per request)
    const BATCH_SIZE = 50;
    for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
      const batch = transactions.slice(i, i + BATCH_SIZE);

      const bankTransactions = batch.map((tx: MappedTransaction) => ({
        type:
          tx.amount < 0
            ? BankTransaction.TypeEnum.SPEND
            : BankTransaction.TypeEnum.RECEIVE,
        contact: tx.counterpartyName
          ? {
              name: tx.counterpartyName,
            }
          : undefined,
        lineItems: [
          {
            description: tx.description,
            quantity: 1,
            unitAmount: Math.abs(tx.amount),
            // Use category's reporting code if available, otherwise default
            accountCode: tx.categoryReportingCode || DEFAULT_ACCOUNT_CODE,
          },
        ],
        bankAccount: {
          accountID: targetAccountId,
        },
        date: tx.date,
        reference: tx.reference || tx.id,
        currencyCode: tx.currency as unknown as CurrencyCode,
      }));

      // Generate idempotency key for the batch based on first transaction
      const firstTx = batch[0];
      const idempotencyKey = firstTx
        ? generateIdempotencyKey(firstTx.id, firstTx.date)
        : undefined;

      try {
        const response = await this.withRetry(
          () =>
            this.client.accountingApi.createBankTransactions(
              tenantId,
              { bankTransactions },
              undefined, // summarizeErrors
              undefined, // unitdp
              idempotencyKey,
            ),
          `Failed to sync batch starting at transaction ${i}`,
        );

        const createdTransactions = response.body.bankTransactions || [];

        for (let j = 0; j < batch.length; j++) {
          const created = createdTransactions[j];
          const original = batch[j];

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
        logger.error("Xero batch sync failed", {
          provider: "xero",
          batchIndex: i,
          batchSize: batch.length,
          error: errorMessage,
        });
        // Mark all transactions in batch as failed
        for (const tx of batch) {
          results.push({
            transactionId: tx.id,
            success: false,
            error: errorMessage,
          });
          failedCount++;
        }
      }
    }

    logger.info("Xero transaction sync completed", {
      provider: "xero",
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
   * Upload attachment to a Xero bank transaction
   */
  async uploadAttachment(
    params: UploadAttachmentParams,
  ): Promise<AttachmentResult> {
    const { tenantId, transactionId, fileName, mimeType, content } = params;

    logger.info("Starting Xero attachment upload", {
      provider: "xero",
      transactionId,
      fileName,
      mimeType,
    });

    await this.ensureClientReady();

    try {
      // Convert content to Buffer if it's a stream
      const buffer = await streamToBuffer(content);

      // Generate idempotency key for attachment
      const idempotencyKey = `midday-attachment-${transactionId}-${fileName}`;

      const response = await this.withRetry(
        () =>
          this.client.accountingApi.createBankTransactionAttachmentByFileName(
            tenantId,
            transactionId,
            fileName,
            buffer,
            idempotencyKey,
            {
              headers: {
                "Content-Type": mimeType,
              },
            },
          ),
        `Failed to upload attachment "${fileName}"`,
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
      logger.error("Xero attachment upload failed", {
        provider: "xero",
        transactionId,
        fileName,
        error: this.getErrorMessage(error),
      });
      return {
        success: false,
        error: this.getErrorMessage(error),
      };
    }
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
