import { triggerSequenceAndWait } from "@jobs/utils/trigger-sequence";
import { updateBaseCurrencySchema } from "@midday/jobs/schema";
import { createClient } from "@midday/supabase/job";
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
    const supabase = createClient();

    // Get all enabled accounts
    const { data: accountsData } = await supabase
      .from("bank_accounts")
      .select("id, currency, balance")
      .eq("team_id", teamId)
      .eq("enabled", true);

    if (!accountsData) {
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
