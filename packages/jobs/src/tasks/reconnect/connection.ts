import { getDb } from "@jobs/init";
import { reconnectConnectionSchema } from "@jobs/schema";
import { syncConnection } from "@jobs/tasks/bank/sync/connection";
import { updateBankConnection } from "@midday/db/queries";
import { updateBankAccountByReference } from "@midday/db/queries";
import { client } from "@midday/engine-client";
import { logger, schemaTask } from "@trigger.dev/sdk";

export const reconnectConnection = schemaTask({
  id: "reconnect-connection",
  maxDuration: 120,
  retry: {
    maxAttempts: 2,
  },
  schema: reconnectConnectionSchema,
  run: async ({ teamId, connectionId, provider }) => {
    const db = getDb();

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

        await updateBankConnection(db, {
          id: connectionId,
          referenceId: referenceId,
        });
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
          await updateBankAccountByReference(db, {
            accountReference: account.resource_id!,
            accountId: account.id,
          });
        }),
      );
    }

    await syncConnection.trigger({
      connectionId,
      manualSync: true,
    });
  },
});
