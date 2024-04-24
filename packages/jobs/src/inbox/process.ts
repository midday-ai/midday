import { eventTrigger } from "@trigger.dev/sdk";
import { z } from "zod";
import { client, supabase } from "../client";
import { Events, Jobs } from "../constants";

client.defineJob({
  id: Jobs.INBOX_PROCESS,
  name: "Inbox - Process",
  version: "0.0.1",
  trigger: eventTrigger({
    name: Events.INBOX_PROCESS,
    schema: z.object({
      teamId: z.string(),
      name: z.string(),
      attachments: z
        .array(
          z.object({
            Name: z.string(),
            Content: z.string(),
          })
        )
        .optional(),
    }),
  }),
  integrations: {
    supabase,
  },
  run: async (payload, io) => {
    const { teamId, name, attachments } = payload;

    // Convert attachments

    // Upload

    // Create records (processing)

    // Process document
  },
});
