import { schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";

// This task trigger a sync for a specific provider
export const syncProvider = schemaTask({
  id: "sync-provider",
  schema: z.object({
    provider: z.enum(["gocardless", "plaid", "teller"]),
  }),
  run: async ({ provider }) => {
    // TODO: Implement
  },
});
