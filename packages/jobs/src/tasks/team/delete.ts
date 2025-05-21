import { deleteTeamSchema } from "@jobs/schema";
import { client } from "@midday/engine-client";
import { logger, schemaTask } from "@trigger.dev/sdk/v3";

export const deleteTeam = schemaTask({
  id: "delete-team",
  schema: deleteTeamSchema,
  maxDuration: 60,
  queue: {
    concurrencyLimit: 10,
  },
  run: async ({ teamId, connections }) => {
    // Unregister sync scheduler (Not implemented yet in Trigger.dev)
    // await schedules.del(teamId);

    // Delete connections in providers
    const connectionPromises = connections.map(async (connection) => {
      return client.connections.delete.$delete({
        json: {
          id: connection.referenceId!,
          provider: connection.provider as
            | "gocardless"
            | "teller"
            | "plaid"
            | "enablebanking",
          accessToken: connection.accessToken ?? undefined,
        },
      });
    });

    logger.info("Deleting team connections", {
      connections: connections.length,
    });

    await Promise.all(connectionPromises);
  },
});
