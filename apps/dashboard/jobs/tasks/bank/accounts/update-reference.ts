import { client } from "@midday/engine/client";
import { createClient } from "@midday/supabase/job";
import { schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";

export const updateReference = schemaTask({
  id: "update-reference",
  maxDuration: 300,
  schema: z.object({
    referenceId: z.string(),
  }),
  run: async ({ referenceId }) => {
    const supabase = createClient();

    const accountsResponse = await client.accounts.$get({
      query: {
        id: referenceId,
        provider: "gocardless",
      },
    });

    const { data: accountsData } = await accountsResponse.json();

    await Promise.all(
      accountsData.map(async (account) => {
        return supabase
          .from("bank_accounts")
          .update({
            account_reference: account.resource_id,
          })
          .eq("account_id", account.id);
      }),
    );
  },
});
