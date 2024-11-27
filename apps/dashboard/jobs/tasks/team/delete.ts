import { createClient } from "@midday/supabase/job";
import { schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";

export const deleteTeam = schemaTask({
  id: "delete-team",
  schema: z.object({
    teamId: z.string().uuid(),
  }),
  maxDuration: 300,
  queue: {
    concurrencyLimit: 10,
  },
  run: async ({ teamId }) => {
    const supabase = createClient();

    const { data: teamData } = await supabase
      .from("teams")
      .select("id, bank_connections(access_token, provider, reference_id)")
      .eq("id", teamId)
      .single();

    if (!teamData) {
      throw new Error("Team not found");
    }

    // Unregister sync scheduler
    // TODO: Not implemented yet in Trigger.dev
    // await schedules.del(teamId);
  },
});
