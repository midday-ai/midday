import { getBankAccounts } from "@midday/db/queries";
import { triggerJob } from "@midday/job-client";
import type { Job } from "bullmq";
import type { UpdateBaseCurrencyPayload } from "../../schemas/transactions";
import { getDb } from "../../utils/db";
import { BaseProcessor } from "../base";

/**
 * Updates base currency for a team
 * Fetches all enabled accounts and triggers update-account-base-currency for each
 */
export class UpdateBaseCurrencyProcessor extends BaseProcessor<UpdateBaseCurrencyPayload> {
  async process(job: Job<UpdateBaseCurrencyPayload>): Promise<void> {
    const { teamId, baseCurrency } = job.data;
    const db = getDb();

    this.logger.info("Starting update-base-currency job", {
      jobId: job.id,
      teamId,
      baseCurrency,
    });

    await this.updateProgress(job, 5);

    // Get all enabled accounts
    const accounts = await getBankAccounts(db, {
      teamId,
      enabled: true,
    });

    if (!accounts || accounts.length === 0) {
      this.logger.info("No enabled accounts found", { teamId });
      await this.updateProgress(job, 100);
      return;
    }

    await this.updateProgress(job, 15);

    this.logger.info("Updating base currency for accounts", {
      teamId,
      accountCount: accounts.length,
      baseCurrency,
    });

    // Trigger update-account-base-currency jobs sequentially
    // Use Promise.all for parallel execution but with proper error handling
    const accountUpdates = accounts.map((account) =>
      triggerJob(
        "update-account-base-currency",
        {
          accountId: account.id,
          currency: account.currency || "USD",
          balance: Number(account.balance) || 0,
          baseCurrency,
        },
        "transactions",
      ),
    );

    await this.updateProgress(job, 25);

    // Wait for all account updates to complete
    const results = await Promise.allSettled(accountUpdates);

    // Calculate progress based on completed accounts
    const completedCount = results.filter(
      (result) => result.status === "fulfilled",
    ).length;
    const accountProgress = Math.min(
      90,
      25 + Math.round((completedCount / accounts.length) * 65),
    );

    await this.updateProgress(job, accountProgress);

    await this.updateProgress(job, 100);

    this.logger.info("Update base currency completed", {
      teamId,
      accountCount: accounts.length,
      baseCurrency,
    });
  }
}
