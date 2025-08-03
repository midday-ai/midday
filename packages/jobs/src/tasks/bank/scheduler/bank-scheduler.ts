import { getDb } from "@jobs/init";
import { getBankConnections } from "@midday/db/queries";
import { logger, schedules } from "@trigger.dev/sdk";
import { syncConnection } from "../sync/connection";

// This is a fan-out pattern. We want to trigger a job for each bank connection
// Then in sync connection we check if the connection is connected and if not we update the status (Connected, Disconnected)
export const bankSyncScheduler = schedules.task({
  id: "bank-sync-scheduler",
  maxDuration: 120,
  run: async (payload) => {
    // Only run in production (Set in Trigger.dev)
    if (process.env.TRIGGER_ENVIRONMENT !== "production") return;

    const db = getDb();

    const teamId = payload.externalId;

    if (!teamId) {
      throw new Error("teamId is required");
    }

    try {
      const bankConnections = await getBankConnections(db, {
        teamId,
      });

      const formattedConnections = bankConnections?.map((connection: any) => ({
        payload: {
          connectionId: connection.id,
        },
        tags: ["team_id", teamId],
      }));

      // If there are no bank connections to sync, return
      if (!formattedConnections?.length) {
        logger.info("No bank connections to sync");
        return;
      }

      await syncConnection.batchTrigger(formattedConnections);
    } catch (error) {
      logger.error("Failed to sync bank connections", { error });

      throw error;
    }
  },
});
