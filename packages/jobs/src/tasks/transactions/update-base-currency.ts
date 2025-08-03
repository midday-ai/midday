import { getDb } from "@jobs/init";
import { triggerSequenceAndWait } from "@jobs/utils/trigger-sequence";
import { getBankAccounts } from "@midday/db/queries";
import { updateBaseCurrencySchema } from "@midday/jobs/schema";
import { schemaTask } from "@trigger.dev/sdk";
import { updateAccountBaseCurrency } from "./update-account-base-currency";

export const updateBaseCurrency = schemaTask({
  id: "update-base-currency",
  schema: updateBaseCurrencySchema,
  maxDuration: 120,
  queue: {
    concurrencyLimit: 10,
  },
  run: async ({ teamId, baseCurrency }) => {
    const db = getDb();

    // Get all enabled accounts
    const accountsData = await getBankAccounts(db, {
      teamId,
      enabled: true,
    });

    if (!accountsData || accountsData.length === 0) {
      return;
    }

    const formattedAccounts = accountsData.map((account) => ({
      accountId: account.id,
      currency: account.currency,
      balance: account.balance,
      baseCurrency,
    }));

    if (formattedAccounts.length > 0) {
      await triggerSequenceAndWait(
        // @ts-expect-error - TODO: Fix types with drizzle
        formattedAccounts,
        updateAccountBaseCurrency,
        {
          delaySeconds: 0,
        },
      );
    }
  },
});
