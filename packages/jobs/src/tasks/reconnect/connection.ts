import { reconnectConnectionSchema } from "@jobs/schema";
import { syncConnection } from "@jobs/tasks/bank/sync/connection";
import { client } from "@midday/engine-client";
import { createClient } from "@midday/supabase/job";
import { logger, schemaTask } from "@trigger.dev/sdk";

export const reconnectConnection = schemaTask({
  id: "reconnect-connection",
  maxDuration: 120,
  retry: {
    maxAttempts: 2,
  },
  schema: reconnectConnectionSchema,
  run: async ({ teamId, connectionId, provider }) => {
    const supabase = createClient();

    if (provider === "gocardless") {
      // We need to update the reference of the connection
      const connection = await client.connections[":reference"].$get({
        param: { reference: teamId },
      });

      if (!connection.ok) {
        throw new Error("Connection not found");
      }

      const connectionResponse = await connection.json();

      const referenceId = connectionResponse?.data.id;

      // Update the reference_id of the new connection
      if (referenceId) {
        logger.info("Updating reference_id of the new connection");

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

      if (!accounts.ok) {
        throw new Error("Accounts not found");
      }

      const accountsResponse = await accounts.json();

      await Promise.all(
        accountsResponse.data.map(async (account) => {
          await supabase
            .from("bank_accounts")
            .update({
              account_id: account.id,
            })
            .eq("account_reference", account.resource_id!);
        }),
      );
    }

    if (provider === "teller") {
      // Get the connection to retrieve access_token and enrollment_id
      const { data: connectionData } = await supabase
        .from("bank_connections")
        .select("access_token, enrollment_id")
        .eq("id", connectionId)
        .single();

      if (!connectionData?.access_token || !connectionData?.enrollment_id) {
        logger.error("Teller connection missing access_token or enrollment_id");
        throw new Error("Teller connection not found");
      }

      // Fetch fresh accounts from Teller API
      // Account IDs may change after reconnect, but last_four (resource_id) remains stable
      const accounts = await client.accounts.$get({
        query: {
          id: connectionData.enrollment_id,
          provider: "teller",
          accessToken: connectionData.access_token,
        },
      });

      if (!accounts.ok) {
        logger.error("Failed to fetch Teller accounts");
        throw new Error("Teller accounts not found");
      }

      const accountsResponse = await accounts.json();

      logger.info("Updating Teller account IDs after reconnect", {
        accountCount: accountsResponse.data.length,
      });

      // Update account_ids by matching on resource_id (last_four)
      await Promise.all(
        accountsResponse.data.map(async (account) => {
          if (account.resource_id) {
            await supabase
              .from("bank_accounts")
              .update({
                account_id: account.id,
              })
              .eq("account_reference", account.resource_id)
              .eq("bank_connection_id", connectionId);
          }
        }),
      );
    }

    await syncConnection.trigger({
      connectionId,
      manualSync: true,
    });
  },
});
