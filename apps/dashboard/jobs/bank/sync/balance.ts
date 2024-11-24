import { client } from "@midday/engine/client";
import { createClient } from "@midday/supabase/job";
import { schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";
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
  }),
  run: async ({ accountId, accessToken, provider }) => {
    const supabase = createClient();

    try {
      const balanceResponse = await client.accounts.balance.$get({
        query: {
          provider,
          id: accountId,
          accessToken,
        },
      });

      if (!balanceResponse.ok) {
        throw new Error("Failed to get balance");
      }

      const { data: balanceData } = await balanceResponse.json();

      // Only update the balance if it's greater than 0
      if (balanceData?.amount && balanceData.amount > 0) {
        await supabase
          .from("bank_accounts")
          .update({
            balance: balanceData.amount,
            error_details: null,
          })
          .eq("id", accountId);
      }
    } catch (error) {
      // TODO: Handle error (disconnect, expired, etc.)
      // Update error details and retries
      // If error retries > 3, set the account to enabled = false

      const parsedError = parseAPIError(error);

      throw error;
    }
  },
});
