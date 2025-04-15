// import { DocumentClient } from "@midday/documents";
import { createClient } from "@midday/supabase/job";
import { schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";

export const processDocument = schemaTask({
  id: "process-document",
  schema: z.object({
    teamId: z.string().uuid(),
    mimetype: z.string(),
    size: z.number(),
    file_path: z.array(z.string()),
  }),
  maxDuration: 300,
  queue: {
    concurrencyLimit: 100,
  },
  run: async ({ teamId, mimetype, size, file_path }) => {
    // const supabase = createClient();
  },
});
