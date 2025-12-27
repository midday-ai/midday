import {
  getAppById,
  updateAppConfig,
  upsertTransactions,
} from "@midday/db/queries";
import type { Job } from "bullmq";
import Stripe from "stripe";
import type { SyncStripePayload } from "../../schemas/stripe";
import { getDb } from "../../utils/db";
import { BaseProcessor } from "../base";

// Transaction method types supported by Midday
type TransactionMethod = "card_purchase" | "transfer" | "other";

interface TransformedTransaction {
  internalId: string;
  name: string;
  date: string;
  amount: number;
  currency: string;
  method: TransactionMethod;
  status: "posted" | "pending";
  internal: boolean;
  teamId: string;
  bankAccountId: string;
  description: string | null;
  counterpartyName: string | null;
  balance: number | null;
  manual: boolean;
  categorySlug: string | null;
}

/**
 * Sync Stripe transactions processor
 * Fetches balance transactions from Stripe and upserts them to the database
 */
export class SyncStripeProcessor extends BaseProcessor<SyncStripePayload> {
  async process(job: Job<SyncStripePayload>): Promise<{
    transactionsProcessed: number;
    syncedAt: string;
  }> {
    const { appId, teamId: providedTeamId, manualSync = false } = job.data;
    const db = getDb();

    // First, get the app by its ID to retrieve teamId and config
    const appRecord = await getAppById(db, { id: appId });

    if (!appRecord) {
      throw new Error(`Stripe app not found: ${appId}`);
    }

    const teamId = providedTeamId || appRecord.teamId;

    if (!teamId) {
      throw new Error(`No teamId found for Stripe app: ${appId}`);
    }

    this.logger.info("Starting Stripe sync", {
      appId,
      teamId,
      manualSync,
    });

    const config = appRecord.config as {
      access_token: string;
      refresh_token: string;
      stripe_account_id: string;
      bank_account_id: string;
      token_expires_at?: string;
    } | null;

    if (!config?.access_token || !config?.refresh_token) {
      this.logger.error("Stripe tokens not found", { appId, teamId });
      throw new Error("Stripe tokens not configured");
    }

    if (!config.bank_account_id) {
      this.logger.error("Stripe bank account ID not found", { appId, teamId });
      throw new Error("Stripe bank account not configured");
    }

    // Check if token needs refresh (expires in 1 hour for Stripe Apps OAuth)
    let accessToken = config.access_token;
    const tokenExpiresAt = config.token_expires_at
      ? new Date(config.token_expires_at)
      : null;
    const needsRefresh =
      !tokenExpiresAt || tokenExpiresAt.getTime() < Date.now() + 5 * 60 * 1000; // 5 min buffer

    if (needsRefresh) {
      this.logger.info("Refreshing Stripe access token", { appId, teamId });
      const newTokens = await this.refreshAccessToken(
        config.refresh_token,
        appId,
        db,
      );
      if (newTokens) {
        accessToken = newTokens.access_token;
      }
    }

    // Initialize Stripe client with the access token
    const stripe = new Stripe(accessToken, {
      apiVersion: "2025-08-27.basil",
    });

    try {
      // Fetch balance transactions
      const transactions: TransformedTransaction[] = [];
      let hasMore = true;
      let startingAfter: string | undefined;

      // For manual sync, fetch more history; for scheduled sync, fetch recent only
      const createdAfter = manualSync
        ? Math.floor(Date.now() / 1000) - 90 * 24 * 60 * 60 // 90 days
        : Math.floor(Date.now() / 1000) - 3 * 24 * 60 * 60; // 3 days

      while (hasMore) {
        const response = await stripe.balanceTransactions.list({
          limit: 100,
          created: { gte: createdAfter },
          ...(startingAfter && { starting_after: startingAfter }),
        });

        for (const bt of response.data) {
          const transformed = this.transformBalanceTransaction(
            bt,
            teamId,
            config.bank_account_id,
          );
          if (transformed) {
            transactions.push(transformed);
          }
        }

        hasMore = response.has_more;
        const lastItem = response.data[response.data.length - 1];
        if (lastItem) {
          startingAfter = lastItem.id;
        }
      }

      this.logger.info("Fetched Stripe transactions", {
        count: transactions.length,
        teamId,
      });

      // Upsert transactions
      if (transactions.length > 0) {
        await upsertTransactions(db, {
          transactions: transactions.map((t) => ({
            ...t,
            notified: true, // Don't send notifications for Stripe transactions
            enrichmentCompleted: true, // No enrichment needed
          })),
          teamId,
        });
      }

      // Update app last synced timestamp using the query function
      await updateAppConfig(db, {
        id: appId,
        config: { last_synced_at: new Date().toISOString() },
      });

      this.logger.info("Stripe sync completed", {
        transactionsProcessed: transactions.length,
        teamId,
      });

      return {
        transactionsProcessed: transactions.length,
        syncedAt: new Date().toISOString(),
      };
    } catch (error) {
      // Check for authentication errors
      if (error instanceof Stripe.errors.StripeAuthenticationError) {
        this.logger.error(
          "Stripe authentication failed - token may be revoked",
          {
            appId,
            teamId,
          },
        );

        // Mark app as disconnected using the query function
        await updateAppConfig(db, {
          id: appId,
          config: {
            status: "disconnected",
            error: "Authentication failed - please reconnect",
          },
        });
      }

      throw error;
    }
  }

  /**
   * Transform a Stripe balance transaction to Midday transaction format
   */
  private transformBalanceTransaction(
    bt: Stripe.BalanceTransaction,
    teamId: string,
    bankAccountId: string,
  ): TransformedTransaction | null {
    // Determine if this is an internal transfer (payout)
    const isInternal = bt.type === "payout" || bt.type === "transfer";

    // Map Stripe type to transaction method
    let method: TransactionMethod = "transfer";
    let categorySlug: string | null = null;

    switch (bt.type) {
      case "charge":
      case "payment":
        method = "transfer";
        categorySlug = "income";
        break;
      case "refund":
      case "payment_refund":
        method = "transfer";
        categorySlug = "income"; // Will be negative amount
        break;
      case "stripe_fee":
      case "application_fee":
        method = "other"; // Map fees to "other"
        categorySlug = "fees";
        break;
      case "payout":
      case "transfer":
        method = "transfer";
        categorySlug = null; // Internal transfer, no category
        break;
      case "adjustment":
        method = "other";
        break;
      default:
        method = "other";
    }

    // Generate a descriptive name
    const name = this.generateTransactionName(bt);

    return {
      internalId: `stripe_${bt.id}`,
      name,
      date: new Date(bt.created * 1000).toISOString().split("T")[0] as string,
      amount: bt.amount / 100, // Convert from cents
      currency: bt.currency.toUpperCase(),
      method,
      status: bt.status === "available" ? "posted" : "pending",
      internal: isInternal,
      teamId,
      bankAccountId,
      description: bt.description,
      counterpartyName: null, // Would need to fetch charge/payment details for this
      balance: null,
      manual: false,
      categorySlug,
    };
  }

  /**
   * Generate a human-readable transaction name
   */
  private generateTransactionName(bt: Stripe.BalanceTransaction): string {
    switch (bt.type) {
      case "charge":
      case "payment":
        return bt.description || "Stripe Payment";
      case "refund":
      case "payment_refund":
        return `Refund: ${bt.description || "Stripe Refund"}`;
      case "stripe_fee":
        return "Stripe Processing Fee";
      case "application_fee":
        return "Stripe Application Fee";
      case "payout":
        return "Payout to Bank";
      case "transfer":
        return "Stripe Transfer";
      case "adjustment":
        return bt.description || "Stripe Adjustment";
      default:
        return bt.description || `Stripe ${bt.type}`;
    }
  }

  /**
   * Refresh the Stripe access token using the refresh token
   * Stripe Apps OAuth tokens expire in 1 hour
   */
  private async refreshAccessToken(
    refreshToken: string,
    appId: string,
    db: ReturnType<typeof getDb>,
  ): Promise<{ access_token: string; refresh_token: string } | null> {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      this.logger.error("STRIPE_SECRET_KEY not configured");
      return null;
    }

    try {
      const response = await fetch("https://api.stripe.com/v1/oauth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${stripeSecretKey}:`).toString("base64")}`,
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        this.logger.error("Failed to refresh Stripe token", { error });
        return null;
      }

      const data = (await response.json()) as {
        access_token: string;
        refresh_token: string;
      };

      // Update the stored tokens
      await updateAppConfig(db, {
        id: appId,
        config: {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          token_expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        },
      });

      this.logger.info("Stripe access token refreshed successfully", { appId });
      return data;
    } catch (error) {
      this.logger.error("Error refreshing Stripe token", {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }
}
