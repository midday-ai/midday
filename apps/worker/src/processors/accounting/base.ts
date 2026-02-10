import {
  type AccountingProvider,
  type AccountingProviderConfig,
  getAccountingProvider,
  getOrgId,
  type MappedTransaction,
} from "@midday/accounting";
import type { Database } from "@midday/db/client";
import { getAppByAppId } from "@midday/db/queries";
import { resolveTaxValues } from "@midday/utils/tax";
import {
  ensureValidToken,
  getProviderCredentials,
  validateProviderCredentials,
} from "../../utils/accounting-auth";
import { getDb } from "../../utils/db";
import { BaseProcessor } from "../base";

/**
 * Result of initializing an accounting provider
 */
export interface InitializedProvider {
  provider: AccountingProvider;
  config: AccountingProviderConfig;
  db: Database;
}

/**
 * Transaction data from DB for mapping to provider format
 */
export interface TransactionForMapping {
  id: string;
  date: string;
  name: string;
  description: string | null;
  amount: number;
  currency: string;
  categorySlug: string | null;
  categoryReportingCode: string | null;
  counterpartyName: string | null;
  /** Tax amount from OCR or manual entry */
  taxAmount: number | null;
  /** Tax rate percentage (e.g., 25 for 25%) */
  taxRate: number | null;
  /** Tax type (e.g., "VAT", "moms", "GST") */
  taxType: string | null;
  /** Category's tax rate (fallback if transaction doesn't have one) */
  categoryTaxRate: number | null;
  /** Category's tax type (fallback if transaction doesn't have one) */
  categoryTaxType: string | null;
  /** User's personal notes about the transaction */
  note: string | null;
  attachments: Array<{
    id: string;
    name: string | null;
    path: string[] | null;
    type: string | null;
    size: number | null;
  }>;
}

/**
 * Supported accounting provider IDs
 */
export type AccountingProviderId = "xero" | "quickbooks" | "fortnox";

/**
 * Check if config has required fields for any accounting provider
 * Uses discriminator-based type narrowing for type safety
 */
function hasRequiredConfigFields(config: AccountingProviderConfig): boolean {
  if (!config.accessToken || !config.refreshToken || !config.provider) {
    return false;
  }
  // Check for organization ID based on provider discriminator
  switch (config.provider) {
    case "xero":
      return !!config.tenantId;
    case "quickbooks":
      return !!config.realmId;
    case "fortnox":
      // Fortnox doesn't require a tenant ID - company context is from token
      return true;
    default: {
      // TypeScript exhaustive check for future providers
      const _exhaustive: never = config;
      return false;
    }
  }
}

/**
 * Base class for accounting processors with shared functionality
 *
 * Provides:
 * - Provider initialization with token validation
 * - Transaction mapping to provider format
 * - Standardized error handling
 */
export abstract class AccountingProcessorBase<
  TData = unknown,
> extends BaseProcessor<TData> {
  /**
   * Initialize an accounting provider with valid tokens
   *
   * Handles:
   * - Fetching app configuration from DB
   * - Validating required config fields
   * - Getting OAuth credentials from environment
   * - Creating provider instance
   * - Refreshing tokens if expired
   *
   * @throws Error if provider is not connected or configuration is invalid
   */
  protected async initializeProvider(
    teamId: string,
    providerId: string,
  ): Promise<InitializedProvider> {
    const db = getDb();

    // Get the app configuration for this provider
    const app = await getAppByAppId(db, { appId: providerId, teamId });

    if (!app || !app.config) {
      throw new Error(`${providerId} is not connected for this team`);
    }

    let config = app.config as AccountingProviderConfig;

    // Validate required config fields
    if (!hasRequiredConfigFields(config)) {
      throw new Error(
        `Invalid ${providerId} configuration - missing tokens or org ID`,
      );
    }

    // Get and validate OAuth credentials from environment
    const credentials = getProviderCredentials(providerId);
    validateProviderCredentials(providerId, credentials);

    const provider = getAccountingProvider(
      providerId as AccountingProviderId,
      config,
    );

    // Ensure token is valid (refresh if expired)
    try {
      config = await ensureValidToken(db, provider, config, teamId, providerId);
      this.logger.info("Token validated/refreshed successfully", {
        teamId,
        providerId,
      });
    } catch (error) {
      this.logger.error("Failed to validate/refresh token", {
        teamId,
        providerId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw new Error("Failed to validate authentication token");
    }

    return { provider, config, db };
  }

  /**
   * Get the organization/tenant ID from the config in a provider-agnostic way
   */
  protected getOrgIdFromConfig(config: AccountingProviderConfig): string {
    return getOrgId(config);
  }

  /**
   * Map transactions from DB format to accounting provider format
   *
   * Handles:
   * - Type conversions
   * - Null coalescing for optional fields
   * - Attachment filtering and mapping
   */
  protected mapTransactionsToProvider(
    transactions: TransactionForMapping[],
  ): MappedTransaction[] {
    return transactions.map((tx) => {
      // Resolve tax values using priority:
      // 1. Transaction taxAmount (if set)
      // 2. Calculate from transaction taxRate
      // 3. Calculate from category taxRate/taxType
      const { taxAmount, taxRate, taxType } = resolveTaxValues({
        transactionAmount: tx.amount,
        transactionTaxAmount: tx.taxAmount,
        transactionTaxRate: tx.taxRate,
        transactionTaxType: tx.taxType,
        categoryTaxRate: tx.categoryTaxRate,
        categoryTaxType: tx.categoryTaxType,
      });

      return {
        id: tx.id,
        date: tx.date,
        amount: tx.amount,
        currency: tx.currency,
        description: tx.name || tx.description || "Transaction",
        reference: tx.id.slice(0, 8),
        counterpartyName: tx.name ?? undefined,
        category: tx.categorySlug ?? undefined,
        categoryReportingCode: tx.categoryReportingCode ?? undefined,
        // Resolved tax values (from transaction or category)
        taxAmount: taxAmount ?? undefined,
        taxRate: taxRate ?? undefined,
        taxType: taxType ?? undefined,
        // User notes
        note: tx.note ?? undefined,
        attachments:
          tx.attachments
            ?.filter(
              (
                att,
              ): att is typeof att & {
                name: string;
                path: string[];
                type: string;
                size: number;
              } =>
                att.name !== null &&
                att.path !== null &&
                att.type !== null &&
                att.size !== null,
            )
            .map((att) => ({
              id: att.id,
              name: att.name,
              path: att.path,
              mimeType: att.type,
              size: att.size,
            })) ?? [],
      };
    });
  }

  /**
   * Get the target bank account from the provider
   * Uses defaultBankAccountId from config if set, otherwise falls back to first active account
   *
   * @throws Error if no active account is found
   */
  protected async getTargetAccount(
    provider: AccountingProvider,
    orgId: string,
    config?: AccountingProviderConfig,
  ): Promise<{ id: string; name: string }> {
    const accounts = await provider.getAccounts(orgId);

    // Use configured default account if set
    if (config?.defaultBankAccountId) {
      const defaultAccount = accounts.find(
        (a) => a.id === config.defaultBankAccountId && a.status === "active",
      );

      if (defaultAccount) {
        this.logger.info("Using configured default account", {
          accountId: defaultAccount.id,
          accountName: defaultAccount.name,
        });
        return defaultAccount;
      }

      this.logger.warn(
        "Configured default account not found or inactive, falling back",
        {
          configuredAccountId: config.defaultBankAccountId,
        },
      );
    }

    // Fall back to first active account
    const targetAccount = accounts.find(
      (a: { status: string }) => a.status === "active",
    );

    if (!targetAccount) {
      throw new Error("No active bank account found in accounting provider");
    }

    this.logger.info("Using target account", {
      accountId: targetAccount.id,
      accountName: targetAccount.name,
    });

    return targetAccount;
  }
}
