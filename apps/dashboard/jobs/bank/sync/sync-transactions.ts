import Midday from "@midday-ai/engine";
import { createClient } from "@midday/supabase/job";
import { logger, schemaTask } from "@trigger.dev/sdk/v3";
import { parseAPIError } from "jobs/utils/parse-error";
import { z } from "zod";
import { engine } from "../../utils/engine";
import { getClassification, transformTransaction } from "../../utils/transform";

export const syncTransactions = schemaTask({
  id: "sync-transactions",
  retry: {
    maxAttempts: 2,
  },
  schema: z.object({
    teamId: z.string().uuid(),
    accountId: z.string(),
    accountType: z.enum([
      "credit",
      "other_asset",
      "other_liability",
      "depository",
      "loan",
    ]),
    accessToken: z.string(),
    provider: z.enum(["gocardless", "plaid", "teller"]),
  }),
  run: async ({ teamId, accountId, accountType, accessToken, provider }) => {
    const supabase = createClient();

    const classification = getClassification(accountType);

    logger.info(`Syncing transactions for account ${accountId}`, {
      classification,
    });

    try {
      // Fetch transactions from our Engine
      const transactions = await engine.transactions.list({
        provider,
        accountId,
        accountType: classification,
        accessToken,
        latest: "true",
      });

      if (!transactions.data) {
        logger.info(`No transactions to upsert for account ${accountId}`);
        return;
      }

      // Transform transactions to match our DB schema
      const formattedTransactions = transactions.data.map((transaction) => {
        return transformTransaction({
          transaction,
          teamId,
          bankAccountId: accountId,
        });
      });

      // Upsert transactions, ignoring duplicates based on internal_id
      await supabase.from("transactions").upsert(formattedTransactions, {
        onConflict: "internal_id",
        ignoreDuplicates: true,
      });
    } catch (error) {
      if (error instanceof Midday.APIError) {
        const parsedError = parseAPIError(error);
        // TODO: Handle error (disconnect, expired, etc.)

        throw error;
      }

      throw error;
    }
  },
});
