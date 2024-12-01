"use server";

import { authActionClient } from "@/actions/safe-action";
import { manualSyncTransactionsSchema } from "@/actions/schema";
import { client } from "@midday/engine/client";
import { LogEvents } from "@midday/events/events";
import { syncConnection } from "jobs/tasks/bank/sync/connection";

export const manualSyncTransactionsAction = authActionClient
  .schema(manualSyncTransactionsSchema)
  .metadata({
    name: "manual-sync-transactions",
    track: {
      event: LogEvents.TransactionsManualSync.name,
      channel: LogEvents.TransactionsManualSync.channel,
    },
  })
  .action(
    async ({
      parsedInput: { connectionId, provider, type },
      ctx: { user, supabase },
    }) => {
      if (provider === "gocardless" && type === "reconnect") {
        // We need to update the reference of the connection
        const connection = await client.connections[":reference"].$get({
          param: { reference: user.team_id! },
        });

        const connectionResponse = await connection.json();

        // Update the reference_id of the new connection
        // In GoCardLess terms this is the requisition id
        if (connectionResponse.data) {
          await supabase
            .from("bank_connections")
            .update({
              reference_id: connectionResponse.data.id,
            })
            .eq("id", connectionId);
        }
      }

      const event = await syncConnection.trigger({
        connectionId,
        manualSync: true,
      });

      return event;
    },
  );
