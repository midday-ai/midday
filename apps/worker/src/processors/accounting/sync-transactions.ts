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
import type { AccountingSyncPayload } from "../../schemas/accounting";
import { getDb } from "../../utils/db";
import { BaseProcessor } from "../base";

// Process transactions in batches
const BATCH_SIZE = 50;

/**
 * Sync transactions to accounting provider processor
 * Fetches unsynced transactions from Midday and pushes them to the accounting provider
 */
export class SyncTransactionsProcessor extends BaseProcessor<AccountingSyncPayload> {
  async process(job: Job<AccountingSyncPayload>): Promise<{
    teamId: string;
    providerId: string;
    syncedCount: number;
    failedCount: number;
    syncedAt: string;
  }> {
    const {
      teamId,
      providerId,
      transactionIds,
      includeAttachments = true,
      manualSync = false,
    } = job.data;

    const db = getDb();
    const supabase = createClient(); // Only used for updating app config (tokens)

    this.logger.info("Starting accounting sync", {
      teamId,
      providerId,
      transactionIdsProvided: transactionIds?.length ?? "all unsynced",
      includeAttachments,
      manualSync,
    });

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

        // Update tokens in database using Supabase (for JSON update)
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

    this.logger.info("Using target account", {
      teamId,
      providerId,
      accountId: targetAccount.id,
      accountName: targetAccount.name,
    });

    // Get transactions for sync using db package
    const transactions = await getTransactionsForAccountingSync(db, {
      teamId,
      provider: providerId as "xero" | "quickbooks" | "fortnox" | "visma",
      transactionIds,
      sinceDaysAgo: manualSync ? 365 : 30, // Longer history for manual sync
      limit: 500,
    });

    if (transactions.length === 0) {
      this.logger.info("No transactions to sync", { teamId, providerId });
      return {
        teamId,
        providerId,
        syncedCount: 0,
        failedCount: 0,
        syncedAt: new Date().toISOString(),
      };
    }

    this.logger.info("Fetched transactions to sync", {
      teamId,
      providerId,
      count: transactions.length,
    });

    // Map transactions to provider format
    const mappedTransactions: MappedTransaction[] = transactions.map((tx) => ({
      id: tx.id,
      date: tx.date,
      amount: tx.amount,
      currency: tx.currency,
      description: tx.name || tx.description || "Transaction",
      reference: tx.id.slice(0, 8), // Short reference
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

    // Sync transactions in batches
    let totalSynced = 0;
    let totalFailed = 0;

    for (let i = 0; i < mappedTransactions.length; i += BATCH_SIZE) {
      const batch = mappedTransactions.slice(i, i + BATCH_SIZE);

      try {
        const result = await provider.syncTransactions({
          transactions: batch,
          targetAccountId: targetAccount.id,
          tenantId: config.tenantId,
        });

        totalSynced += result.syncedCount;
        totalFailed += result.failedCount;

        // Create sync records for each transaction using db package
        for (const txResult of result.results) {
          await upsertAccountingSyncRecord(db, {
            transactionId: txResult.transactionId,
            teamId,
            provider: providerId as "xero" | "quickbooks" | "fortnox" | "visma",
            providerTenantId: config.tenantId,
            providerTransactionId: txResult.providerTransactionId,
            syncType: manualSync ? "manual" : "auto",
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

        this.logger.info("Batch sync completed", {
          teamId,
          providerId,
          batchIndex: Math.floor(i / BATCH_SIZE) + 1,
          batchSize: batch.length,
          synced: result.syncedCount,
          failed: result.failedCount,
        });
      } catch (error) {
        this.logger.error("Batch sync failed", {
          teamId,
          providerId,
          batchIndex: Math.floor(i / BATCH_SIZE) + 1,
          error: error instanceof Error ? error.message : "Unknown error",
        });

        // Mark all transactions in batch as failed
        totalFailed += batch.length;

        for (const tx of batch) {
          await upsertAccountingSyncRecord(db, {
            transactionId: tx.id,
            teamId,
            provider: providerId as "xero" | "quickbooks" | "fortnox" | "visma",
            providerTenantId: config.tenantId,
            syncType: manualSync ? "manual" : "auto",
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

    this.logger.info("Accounting sync completed", {
      teamId,
      providerId,
      totalSynced,
      totalFailed,
      total: mappedTransactions.length,
    });

    return {
      teamId,
      providerId,
      syncedCount: totalSynced,
      failedCount: totalFailed,
      syncedAt: new Date().toISOString(),
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
