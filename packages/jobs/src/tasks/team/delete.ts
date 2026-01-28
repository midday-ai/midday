import { trpc } from "@jobs/client/trpc";
import { deleteTeamSchema } from "@jobs/schema";
import { logger, schedules, schemaTask } from "@trigger.dev/sdk";
import { bankSyncScheduler } from "../bank/scheduler/bank-scheduler";

export const deleteTeam = schemaTask({
  id: "delete-team",
  schema: deleteTeamSchema,
  maxDuration: 60,
  queue: {
    concurrencyLimit: 10,
  },
  run: async ({ teamId, connections }) => {
    // Delete connections in providers
    const connectionPromises = connections.map(async (connection) => {
      return trpc.bankingService.deleteConnection.mutate({
        provider: connection.provider as
          | "gocardless"
          | "teller"
          | "plaid"
          | "enablebanking",
        id: connection.referenceId!,
        accessToken: connection.accessToken ?? undefined,
      });
    });

    logger.info("Deleting team connections", {
      connections: connections.length,
    });

    await Promise.all(connectionPromises);

    // Unregister bank sync scheduler by deduplication key
    await schedules.del(`${teamId}-${bankSyncScheduler.id}`);
  },
});
