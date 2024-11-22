import { createClient } from "@midday/supabase/job";
import { logger, schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";

export const syncBalance = schemaTask({
  id: "sync-balance",
  schema: z.object({
    team_id: z.string().uuid(),
    bank_account_id: z.string(),
  }),
  run: async ({ team_id, bank_account_id }) => {
    const supabase = createClient();
  },
});
