import { XeroClient } from "xero-node";
import { BaseAccountingProvider } from "../provider";
import type {
  AccountingAccount,
  AccountingProviderId,
  AttachmentResult,
  ProviderInitConfig,
  SyncResult,
  SyncTransactionsParams,
  TokenSet,
  UploadAttachmentParams,
} from "../types";

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

/**
 * Xero accounting provider implementation
 */
export class XeroProvider extends BaseAccountingProvider {
  readonly id: AccountingProviderId = "xero";
  readonly name = "Xero";

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
   * Build OAuth consent URL for Xero authorization
   */
  async buildConsentUrl(state: string): Promise<string> {
    await this.client.initialize();
    // Xero SDK handles state internally, but we can pass custom state
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
      throw new Error("No Xero organization found");
    }

    return {
      accessToken: tokenSet.access_token!,
      refreshToken: tokenSet.refresh_token!,
      expiresAt: new Date(tokenSet.expires_at! * 1000),
      tokenType: tokenSet.token_type || "Bearer",
      scope: tokenSet.scope?.split(" "),
    };
  }

  /**
   * Refresh expired tokens
   */
  async refreshTokens(refreshToken: string): Promise<TokenSet> {
    const tokenSet = await this.client.refreshWithRefreshToken(
      this.config.clientId,
      this.config.clientSecret,
      refreshToken
    );

    return {
      accessToken: tokenSet.access_token!,
      refreshToken: tokenSet.refresh_token!,
      expiresAt: new Date(tokenSet.expires_at! * 1000),
      tokenType: tokenSet.token_type || "Bearer",
      scope: tokenSet.scope?.split(" "),
    };
  }

  /**
   * Get bank accounts from Xero
   */
  async getAccounts(tenantId: string): Promise<AccountingAccount[]> {
    const accessToken = await this.getValidAccessToken();

    await this.client.setTokenSet({
      access_token: accessToken,
      refresh_token: this.config.config?.refreshToken,
      expires_at: Math.floor(
        new Date(this.config.config?.expiresAt || Date.now()).getTime() / 1000
      ),
      token_type: "Bearer",
    });

    const response = await this.client.accountingApi.getAccounts(
      tenantId,
      undefined, // ifModifiedSince
      'Type=="BANK"' // Only bank accounts
    );

    const accounts = response.body.accounts || [];

    return accounts.map((account) => ({
      id: account.accountID!,
      name: account.name!,
      code: account.code,
      type: account.type?.toString() || "BANK",
      currency: account.currencyCode,
      status: account.status === "ACTIVE" ? "active" : "archived",
    }));
  }

  /**
   * Sync transactions to Xero as bank transactions
   */
  async syncTransactions(params: SyncTransactionsParams): Promise<SyncResult> {
    const { transactions, targetAccountId, tenantId } = params;
    const accessToken = await this.getValidAccessToken();

    await this.client.setTokenSet({
      access_token: accessToken,
      refresh_token: this.config.config?.refreshToken,
      expires_at: Math.floor(
        new Date(this.config.config?.expiresAt || Date.now()).getTime() / 1000
      ),
      token_type: "Bearer",
    });

    const results: SyncResult["results"] = [];
    let syncedCount = 0;
    let failedCount = 0;

    // Process transactions in batches (Xero recommends max 50 per request)
    const BATCH_SIZE = 50;
    for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
      const batch = transactions.slice(i, i + BATCH_SIZE);

      const bankTransactions = batch.map((tx) => ({
        type:
          tx.amount < 0
            ? ("SPEND" as const)
            : ("RECEIVE" as const),
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
            accountCode: "400", // Default expense account - should be configurable
          },
        ],
        bankAccount: {
          accountID: targetAccountId,
        },
        date: tx.date,
        reference: tx.reference || tx.id,
        currencyCode: tx.currency,
      }));

      try {
        const response =
          await this.client.accountingApi.createBankTransactions(tenantId, {
            bankTransactions,
          });

        const createdTransactions = response.body.bankTransactions || [];

        for (let j = 0; j < batch.length; j++) {
          const created = createdTransactions[j];
          const original = batch[j];

          if (created?.bankTransactionID) {
            results.push({
              transactionId: original!.id,
              providerTransactionId: created.bankTransactionID,
              success: true,
            });
            syncedCount++;
          } else {
            results.push({
              transactionId: original!.id,
              success: false,
              error: "Transaction not created",
            });
            failedCount++;
          }
        }
      } catch (error) {
        // Mark all transactions in batch as failed
        for (const tx of batch) {
          results.push({
            transactionId: tx.id,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
          failedCount++;
        }
      }
    }

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
    params: UploadAttachmentParams
  ): Promise<AttachmentResult> {
    const { tenantId, transactionId, fileName, mimeType, content } = params;
    const accessToken = await this.getValidAccessToken();

    await this.client.setTokenSet({
      access_token: accessToken,
      refresh_token: this.config.config?.refreshToken,
      expires_at: Math.floor(
        new Date(this.config.config?.expiresAt || Date.now()).getTime() / 1000
      ),
      token_type: "Bearer",
    });

    try {
      // Convert content to Buffer if it's a stream
      let buffer: Buffer;
      if (Buffer.isBuffer(content)) {
        buffer = content;
      } else {
        const chunks: Uint8Array[] = [];
        const reader = (content as ReadableStream).getReader();
        let done = false;
        while (!done) {
          const result = await reader.read();
          done = result.done;
          if (result.value) {
            chunks.push(result.value);
          }
        }
        buffer = Buffer.concat(chunks);
      }

      const response =
        await this.client.accountingApi.createBankTransactionAttachmentByFileName(
          tenantId,
          transactionId,
          fileName,
          buffer,
          undefined, // idempotencyKey
          {
            headers: {
              "Content-Type": mimeType,
            },
          }
        );

      const attachments = response.body.attachments || [];
      const attachment = attachments[0];

      if (attachment?.attachmentID) {
        return {
          success: true,
          attachmentId: attachment.attachmentID,
        };
      }

      return {
        success: false,
        error: "Attachment not created",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get tenant/organization information
   */
  async getTenantInfo(
    tenantId: string
  ): Promise<{ id: string; name: string; currency?: string }> {
    const accessToken = await this.getValidAccessToken();

    await this.client.setTokenSet({
      access_token: accessToken,
      refresh_token: this.config.config?.refreshToken,
      expires_at: Math.floor(
        new Date(this.config.config?.expiresAt || Date.now()).getTime() / 1000
      ),
      token_type: "Bearer",
    });

    const response =
      await this.client.accountingApi.getOrganisations(tenantId);
    const org = response.body.organisations?.[0];

    if (!org) {
      throw new Error("Organization not found");
    }

    return {
      id: tenantId,
      name: org.name || "Unknown",
      currency: org.baseCurrency,
    };
  }

  /**
   * Get tenants (organizations) connected to this Xero app
   */
  async getTenants(): Promise<
    Array<{ tenantId: string; tenantName: string; tenantType: string }>
  > {
    const accessToken = await this.getValidAccessToken();

    await this.client.setTokenSet({
      access_token: accessToken,
      refresh_token: this.config.config?.refreshToken,
      expires_at: Math.floor(
        new Date(this.config.config?.expiresAt || Date.now()).getTime() / 1000
      ),
      token_type: "Bearer",
    });

    await this.client.updateTenants();

    return this.client.tenants.map((tenant) => ({
      tenantId: tenant.tenantId,
      tenantName: tenant.tenantName || "Unknown",
      tenantType: tenant.tenantType || "ORGANISATION",
    }));
  }
}

