import { client } from "@midday/engine/client";
import { createClient } from "@midday/supabase/job";
import { schemaTask } from "@trigger.dev/sdk/v3";
import { syncConnection } from "jobs/tasks/bank/sync/connection";
import { z } from "zod";

export const reconnectConnection = schemaTask({
  id: "reconnect-connection",
  maxDuration: 1000,
  retry: {
    maxAttempts: 2,
  },
  schema: z.object({
    teamId: z.string().uuid(),
    connectionId: z.string().uuid(),
    provider: z.string(),
  }),
  run: async ({ teamId, connectionId, provider }) => {
    const supabase = createClient();

    if (provider === "gocardless") {
      // We need to update the reference of the connection
      const connection = await client.connections[":reference"].$get({
        param: { reference: teamId },
      });

      const connectionResponse = await connection.json();
      const referenceId = connectionResponse?.data.id;

      // Update the reference_id of the new connection
      if (referenceId) {
        await supabase
          .from("bank_connections")
          .update({
            reference_id: referenceId,
          })
          .eq("id", connectionId);
      }

      // The account_ids can be different between the old and new connection
      // So we need to check for account_reference and update
      const accounts = await client.accounts.$get({
        query: {
          id: referenceId,
          provider: "gocardless",
        },
      });

      const accountsResponse = await accounts.json();

      await Promise.all(
        accountsResponse.data.map(async (account) => {
          await supabase
            .from("bank_accounts")
            .update({
              account_id: account.id,
            })
            .eq("account_reference", account.resource_id);
        }),
      );
    }

    await syncConnection.trigger({
      connectionId,
      manualSync: true,
    });
  },
});
