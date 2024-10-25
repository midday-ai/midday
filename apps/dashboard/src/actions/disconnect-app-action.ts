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
  .action(async ({ parsedInput: { appId }, ctx: { supabase, user } }) => {
    console.log("disconnection app with following params", {
      appId: appId,
      teamId: user?.team_id,
    });

    const { data, error } = await supabase
      .from("apps")
      .delete()
      .eq("app_id", appId)
      .eq("team_id", user.team_id as string)
      .select();

    if (error) {
      console.error(error);
      throw error;
    }

    revalidatePath("/apps");

    return data;
  });
