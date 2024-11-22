import { Midday } from "@midday-ai/engine";
import { createClient } from "@midday/supabase/job";
import { logger, schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { engine } from "../../utils/engine";
import { parseAPIError } from "../../utils/parse-error";

export const syncBalance = schemaTask({
  id: "sync-balance",
  retry: {
    maxAttempts: 2,
  },
  schema: z.object({
    accountId: z.string(),
    accessToken: z.string().optional(),
    provider: z.enum(["gocardless", "plaid", "teller"]),
    connectionId: z.string(),
  }),
  run: async ({ accountId, accessToken, provider, connectionId }) => {
    const supabase = createClient();

    try {
      const balance = await engine.accounts.balance({
        provider,
        id: accountId,
        accessToken,
      });

      // Only update the balance if it's greater than 0
      if (balance.data?.amount && balance.data.amount > 0) {
        await supabase
          .from("bank_accounts")
          .update({
            balance: balance.data.amount,
            error_details: null,
          })
          .eq("id", accountId);
      }
    } catch (error) {
      if (error instanceof Midday.APIError) {
        const parsedError = parseAPIError(error);
        // TODO: Handle error (disconnect, expired, etc.)
        // Update error details and retries
        // If error retries > 3, set the account to enabled = false

        throw error;
      }

      throw error;
    }
  },
});
