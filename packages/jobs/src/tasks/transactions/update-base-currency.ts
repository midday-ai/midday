import { triggerSequenceAndWait } from "@/utils/trigger-sequence";
import { createClient } from "@midday/supabase/job";
import { schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { updateAccountBaseCurrency } from "./update-account-base-currency";

export const updateBaseCurrency = schemaTask({
  id: "update-base-currency",
  schema: z.object({
    teamId: z.string().uuid(),
    baseCurrency: z.string(),
  }),
  maxDuration: 300,
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
        formattedAccounts,
        updateAccountBaseCurrency,
        {
          delayMinutes: 0,
        },
      );
    }
  },
});
