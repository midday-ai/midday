import { createClient } from "@midday/supabase/job";
import { schedules } from "@trigger.dev/sdk/v3";
import { syncConnection } from "../sync/connection";

// This is a fan-out pattern. We want to trigger a task for each bank connection.
export const bankSyncScheduler = schedules.task({
  id: "bank-sync-scheduler",
  run: async (payload) => {
    const supabase = createClient();

    const teamId = payload.externalId;

    if (!teamId) {
      throw new Error("externalId is required");
    }

    const { data: bankConnections, error } = await supabase
      .from("bank_connections")
      .select("id")
      .eq("team_id", teamId)
      .eq("enabled", true)
      .eq("manual", false);

    if (error) {
      throw error;
    }

    const formattedConnections = bankConnections.map((connection) => ({
      payload: {
        connectionId: connection.id,
      },
      tags: ["team_id", teamId],
    }));

    await syncConnection.batchTrigger(formattedConnections);
  },
});
