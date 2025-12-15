import {
  type AccountingProviderConfig,
  type MappedTransaction,
  getAccountingProvider,
} from "@midday/accounting";
import {
  getAppByAppId,
  getTransactionsForAccountingSync,
  upsertAccountingSyncRecord,
} from "@midday/db/queries";
import { triggerJob } from "@midday/job-client";
import { createClient } from "@midday/supabase/job";
import type { Job } from "bullmq";
import type { AccountingExportPayload } from "../../schemas/accounting";
import { getDb } from "../../utils/db";
import { BaseProcessor } from "../base";

// Process transactions in batches
const BATCH_SIZE = 50;

/**
 * Export transactions to accounting provider processor
 * Manual export of selected transactions to the accounting provider
 */
export class ExportTransactionsProcessor extends BaseProcessor<AccountingExportPayload> {
  async process(job: Job<AccountingExportPayload>): Promise<{
    teamId: string;
    providerId: string;
    exportedCount: number;
    failedCount: number;
    exportedAt: string;
  }> {
    const { teamId, userId, providerId, transactionIds, includeAttachments } =
      job.data;

    const db = getDb();
    const supabase = createClient(); // Only for updating app config (tokens)

    this.logger.info("Starting manual accounting export", {
      teamId,
      userId,
      providerId,
      transactionCount: transactionIds.length,
      includeAttachments,
    });

    if (transactionIds.length === 0) {
      return {
        teamId,
        providerId,
        exportedCount: 0,
        failedCount: 0,
        exportedAt: new Date().toISOString(),
      };
    }

    // Get the app configuration for this provider
    const app = await getAppByAppId(db, { appId: providerId, teamId });

    if (!app || !app.config) {
      throw new Error(`${providerId} is not connected for this team`);
    }

    const config = app.config as AccountingProviderConfig;

    // Validate required config fields
    if (!config.accessToken || !config.refreshToken || !config.tenantId) {
      throw new Error(`Invalid ${providerId} configuration - missing tokens`);
    }

    // Initialize the accounting provider
    const clientId = this.getClientId(providerId);
    const clientSecret = this.getClientSecret(providerId);
    const redirectUri = this.getRedirectUri(providerId);

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error(`Missing OAuth configuration for ${providerId}`);
    }

    const provider = getAccountingProvider(providerId as "xero", {
      clientId,
      clientSecret,
      redirectUri,
      config,
    });

    // Check if token needs refresh
    const expiresAt = new Date(config.expiresAt);
    if (provider.isTokenExpired(expiresAt)) {
      this.logger.info("Refreshing expired token", { teamId, providerId });

      try {
        const newTokens = await provider.refreshTokens(config.refreshToken);

        // Update tokens in database
        await supabase
          .from("apps")
          .update({
            config: {
              ...config,
              accessToken: newTokens.accessToken,
              refreshToken: newTokens.refreshToken,
              expiresAt: newTokens.expiresAt.toISOString(),
            },
          })
          .eq("team_id", teamId)
          .eq("app_id", providerId);

        this.logger.info("Token refreshed successfully", {
          teamId,
          providerId,
        });
      } catch (error) {
        this.logger.error("Failed to refresh token", {
          teamId,
          providerId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        throw new Error("Failed to refresh authentication token");
      }
    }

    // Get target account (first bank account from provider)
    const accounts = await provider.getAccounts(config.tenantId);
    const targetAccount = accounts.find(
      (a: { status: string }) => a.status === "active",
    );

    if (!targetAccount) {
      throw new Error("No active bank account found in accounting provider");
    }

    // Fetch transactions using db package
    // Note: For export, we include the specific transaction IDs regardless of sync status
    const transactions = await getTransactionsForAccountingSync(db, {
      teamId,
      provider: providerId as "xero" | "quickbooks" | "fortnox" | "visma",
      transactionIds,
      sinceDaysAgo: 365, // Look back a full year for manual exports
      limit: transactionIds.length,
    });

    if (transactions.length === 0) {
      this.logger.warn("No transactions found for export", {
        teamId,
        transactionIds,
      });
      return {
        teamId,
        providerId,
        exportedCount: 0,
        failedCount: 0,
        exportedAt: new Date().toISOString(),
      };
    }

    // Map transactions to provider format
    const mappedTransactions: MappedTransaction[] = transactions.map((tx) => ({
      id: tx.id,
      date: tx.date,
      amount: tx.amount,
      currency: tx.currency,
      description: tx.name || tx.description || "Transaction",
      reference: tx.id.slice(0, 8),
      counterpartyName: tx.name,
      category: tx.categorySlug ?? undefined,
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
    }));

    // Export transactions in batches
    let totalExported = 0;
    let totalFailed = 0;

    for (let i = 0; i < mappedTransactions.length; i += BATCH_SIZE) {
      const batch = mappedTransactions.slice(i, i + BATCH_SIZE);

      try {
        const result = await provider.syncTransactions({
          transactions: batch,
          targetAccountId: targetAccount.id,
          tenantId: config.tenantId,
        });

        totalExported += result.syncedCount;
        totalFailed += result.failedCount;

        // Create sync records for each transaction
        for (const txResult of result.results) {
          await upsertAccountingSyncRecord(db, {
            transactionId: txResult.transactionId,
            teamId,
            provider: providerId as "xero" | "quickbooks" | "fortnox" | "visma",
            providerTenantId: config.tenantId,
            providerTransactionId: txResult.providerTransactionId,
            syncType: "manual",
            status: txResult.success ? "synced" : "failed",
            errorMessage: txResult.error,
          });

          // Trigger attachment sync if enabled and transaction has attachments
          if (
            txResult.success &&
            txResult.providerTransactionId &&
            includeAttachments
          ) {
            const originalTx = transactions.find(
              (t) => t.id === txResult.transactionId,
            );
            const attachments =
              originalTx?.attachments?.filter((a) => a.name !== null) ?? [];

            if (attachments.length > 0) {
              await triggerJob(
                "sync-accounting-attachments",
                {
                  teamId,
                  providerId,
                  transactionId: txResult.transactionId,
                  providerTransactionId: txResult.providerTransactionId,
                  attachmentIds: attachments.map((a) => a.id),
                },
                "accounting",
              );
            }
          }
        }

        this.logger.info("Export batch completed", {
          teamId,
          providerId,
          batchIndex: Math.floor(i / BATCH_SIZE) + 1,
          exported: result.syncedCount,
          failed: result.failedCount,
        });
      } catch (error) {
        this.logger.error("Export batch failed", {
          teamId,
          providerId,
          batchIndex: Math.floor(i / BATCH_SIZE) + 1,
          error: error instanceof Error ? error.message : "Unknown error",
        });

        totalFailed += batch.length;

        for (const tx of batch) {
          await upsertAccountingSyncRecord(db, {
            transactionId: tx.id,
            teamId,
            provider: providerId as "xero" | "quickbooks" | "fortnox" | "visma",
            providerTenantId: config.tenantId,
            syncType: "manual",
            status: "failed",
            errorMessage:
              error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      // Update progress
      const progress = Math.round(
        ((i + batch.length) / mappedTransactions.length) * 100,
      );
      await this.updateProgress(job, progress);
    }

    this.logger.info("Manual accounting export completed", {
      teamId,
      userId,
      providerId,
      totalExported,
      totalFailed,
      total: mappedTransactions.length,
    });

    return {
      teamId,
      providerId,
      exportedCount: totalExported,
      failedCount: totalFailed,
      exportedAt: new Date().toISOString(),
    };
  }

  private getClientId(providerId: string): string | undefined {
    switch (providerId) {
      case "xero":
        return process.env.XERO_CLIENT_ID;
      case "quickbooks":
        return process.env.QUICKBOOKS_CLIENT_ID;
      default:
        return undefined;
    }
  }

  private getClientSecret(providerId: string): string | undefined {
    switch (providerId) {
      case "xero":
        return process.env.XERO_CLIENT_SECRET;
      case "quickbooks":
        return process.env.QUICKBOOKS_CLIENT_SECRET;
      default:
        return undefined;
    }
  }

  private getRedirectUri(providerId: string): string | undefined {
    switch (providerId) {
      case "xero":
        return process.env.XERO_OAUTH_REDIRECT_URL;
      case "quickbooks":
        return process.env.QUICKBOOKS_OAUTH_REDIRECT_URL;
      default:
        return undefined;
    }
  }
}
