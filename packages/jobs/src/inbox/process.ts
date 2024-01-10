import { eventTrigger } from "@trigger.dev/sdk";
import { z } from "zod";
import { client, supabase } from "../client";
import { Events, Jobs } from "../constants";

client.defineJob({
  id: Jobs.PROCESS_INBOX,
  name: "Process Inbox",
  version: "0.0.1",
  trigger: eventTrigger({
    name: Events.PROCESS_INBOX,
    schema: z.object({
      inboxId: z.string(),
    }),
  }),
  integrations: { supabase },
  run: async (payload, io) => {
    const client = await io.supabase.client;
    // get file_path and type

    // If PDF

    // Get name, due date
    // Get amount and strip
    // Get currency
  },
});
