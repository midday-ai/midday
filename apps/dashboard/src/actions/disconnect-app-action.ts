"use server";

import { LogEvents } from "@midday/events/events";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authActionClient } from "./safe-action";

export const disconnectAppAction = authActionClient
  .schema(
    z.object({
      appId: z.string(),
    }),
  )
  .metadata({
    name: "disconnect-app",
    track: {
      event: LogEvents.DisconnectApp.name,
      channel: LogEvents.DisconnectApp.channel,
    },
  })
  .action(async ({ parsedInput: { appId }, ctx: { supabase } }) => {
    const { data } = await supabase
      .from("apps")
      .delete()
      .eq("app_id", appId)
      .select();

    revalidatePath("/apps");

    return data;
  });
