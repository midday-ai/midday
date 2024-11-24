import { createClient } from "@midday/supabase/job";
import { logger, schedules } from "@trigger.dev/sdk/v3";
import { syncConnection } from "../sync/connection";

// This is a fan-out pattern. We want to trigger a task for each bank connection
// that has a status of "connected".
export const bankSyncScheduler = schedules.task({
  id: "bank-sync-scheduler",
  run: async (payload) => {
    const supabase = createClient();

    const teamId = payload.externalId;

    if (!teamId) {
      throw new Error("externalId is required");
    }

    try {
      // Get all bank connections that has a status of "connected"
      const { data: bankConnections } = await supabase
        .from("bank_connections")
        .select("id")
        .eq("team_id", teamId)
        .eq("status", "connected")
        .throwOnError();

      const formattedConnections = bankConnections?.map((connection) => ({
        payload: {
          connectionId: connection.id,
        },
        tags: ["team_id", teamId],
      }));

      if (!formattedConnections) {
        return;
      }

      await syncConnection.batchTrigger(formattedConnections);
    } catch (error) {
      logger.error("Failed to sync bank connections", { error });

      throw error;
    }
  },
});
