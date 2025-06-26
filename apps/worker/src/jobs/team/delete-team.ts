import { client } from "@midday/engine-client";
import { job } from "@worker/core/job";
import { teamsQueue } from "@worker/queues/queues";
import { z } from "zod";

export const deleteTeamSchema = z.object({
  teamId: z.string().uuid(),
  connections: z.array(
    z.object({
      provider: z.string(),
      referenceId: z.string().nullable(),
      accessToken: z.string().nullable(),
    }),
  ),
});

export const deleteTeamJob = job(
  "delete-team",
  deleteTeamSchema,
  {
    queue: teamsQueue,
  },
  async (data, ctx) => {
    ctx.logger.info(
      `Deleting team ${data.teamId} with ${data.connections.length} connections`,
    );

    // TODO: Unregister scheduler

    // Delete connections in providers
    const connectionPromises = data.connections.map(async (connection) => {
      ctx.logger.info("Deleting connection", {
        provider: connection.provider,
        referenceId: connection.referenceId,
      });

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

    ctx.logger.info("Deleting team connections", {
      connections: data.connections.length,
    });

    await Promise.all(connectionPromises);

    ctx.logger.info(
      `Successfully deleted ${data.connections.length} connections for team ${data.teamId}`,
    );

    return {
      type: "team-deleted",
      teamId: data.teamId,
      connectionsDeleted: data.connections.length,
      deletedAt: new Date(),
    };
  },
);
