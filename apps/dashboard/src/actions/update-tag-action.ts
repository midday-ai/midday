"use server";

import { LogEvents } from "@midday/events/events";
import { revalidateTag } from "next/cache";
import { authActionClient } from "./safe-action";
import { updateTagSchema } from "./schema";

export const updateTagAction = authActionClient
  .schema(updateTagSchema)
  .metadata({
    name: "update-tag",
    track: {
      event: LogEvents.UpdateTag.name,
      channel: LogEvents.UpdateTag.channel,
    },
  })
  .action(async ({ parsedInput: { name, id }, ctx: { supabase, user } }) => {
    const { data } = await supabase
      .from("tags")
      .update({
        name,
      })
      .eq("id", id)
      .select("id, name")
      .single();

    revalidateTag(`tracker_projects_${user.team_id}`);

    // TODO: Fix transaction sheet rerendering
    // revalidateTag(`transactions_${user.team_id}`);

    return data;
  });
