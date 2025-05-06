import { client } from "@midday/engine/client";
import { logger, schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";

export const deleteTeam = schemaTask({
  id: "delete-team",
  schema: z.object({
    teamId: z.string().uuid(),
    connections: z.array(
      z.object({
        provider: z.string().nullable(),
        reference_id: z.string().nullable(),
        access_token: z.string().nullable(),
      }),
    ),
  }),
  maxDuration: 60,
  queue: {
    concurrencyLimit: 10,
  },
  run: async ({ teamId, connections }) => {
    // Unregister sync scheduler (Not implemented yet in Trigger.dev)
    // await schedules.del(teamId);

    // Delete connections in providers
    const connectionPromises = connections.map(async (connection) => {
      return client.connections.delete.$post({
        json: {
          id: connection.reference_id,
          provider: connection.provider,
          accessToken: connection.access_token,
        },
      });
    });

    logger.info("Deleting team connections", {
      connections: connections.length,
    });

    await Promise.all(connectionPromises);
  },
});
