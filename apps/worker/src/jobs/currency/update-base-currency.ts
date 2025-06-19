import { getBankAccounts } from "@midday/db/queries";
import { job } from "@worker/core/job";
import { z } from "zod";
import { updateAccountBaseCurrencyJob } from "./update-account-base-currency";

const updateBaseCurrencySchema = z.object({
  teamId: z.string().uuid(),
  baseCurrency: z.string().min(3).max(3),
});

// Type definitions
interface AccountSummary {
  accountId: string;
  currency: string;
  balance: number;
}

interface UpdateBaseCurrencyResult {
  processed: number;
  accounts: AccountSummary[];
  flowJobId?: string;
  childJobsCount?: number;
}

const DEFAULT_CURRENCY = "USD";
const DEFAULT_BALANCE = 0;

export const updateBaseCurrencyJob = job(
  "update-base-currency",
  updateBaseCurrencySchema,
  {
    queue: "system",
    priority: 2,
    attempts: 3,
  },
  async (data, { db, logger }): Promise<UpdateBaseCurrencyResult> => {
    const { teamId, baseCurrency } = data;

    logger.info("Starting base currency update", { teamId, baseCurrency });

    try {
      // Get all enabled accounts for the team
      const accounts = await getBankAccounts(db, { teamId, enabled: true });

      if (accounts.length === 0) {
        logger.info("No enabled accounts found for team", { teamId });
        return { processed: 0, accounts: [] };
      }

      logger.info("Found accounts to update", {
        teamId,
        accountCount: accounts.length,
        accounts: accounts.map((account) => ({
          id: account.id,
          currency: account.currency,
        })),
      });

      // Create account summaries with validated data
      const accountSummaries: AccountSummary[] = accounts.map((account) => ({
        accountId: account.id,
        currency: account.currency || DEFAULT_CURRENCY,
        balance: account.balance || DEFAULT_BALANCE,
      }));

      // Create child jobs for flow
      const childJobs = accounts.map((account) => ({
        job: updateAccountBaseCurrencyJob,
        data: {
          accountId: account.id,
          teamId,
          currency: account.currency || DEFAULT_CURRENCY,
          balance: account.balance || DEFAULT_BALANCE,
          baseCurrency,
        },
      }));

      // Use flow to trigger all account updates with parent-child relationship
      const flow = await updateBaseCurrencyJob.triggerFlow({
        data,
        children: childJobs,
      });

      logger.info("Base currency update flow started", {
        teamId,
        baseCurrency,
        accountsProcessed: accounts.length,
        flowJobId: flow.job.id,
        childJobsCount: childJobs.length,
      });

      return {
        processed: accounts.length,
        accounts: accountSummaries,
        flowJobId: flow.job.id,
        childJobsCount: childJobs.length,
      };
    } catch (error) {
      logger.error("Failed to update base currency", {
        teamId,
        baseCurrency,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },
);
