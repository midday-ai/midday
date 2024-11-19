"use server";

import { LogEvents } from "@midday/events/events";
import { revalidateTag } from "next/cache";
import { authActionClient } from "./safe-action";
import { deleteTagSchema } from "./schema";

export const deleteTagAction = authActionClient
  .schema(deleteTagSchema)
  .metadata({
    name: "delete-tag",
    track: {
      event: LogEvents.DeleteTag.name,
      channel: LogEvents.DeleteTag.channel,
    },
  })
  .action(async ({ parsedInput: { id }, ctx: { supabase, user } }) => {
    const { data } = await supabase
      .from("tags")
      .delete()
      .eq("id", id)
      .select("id, name")
      .single();

    revalidateTag(`tracker_projects_${user.team_id}`);
    revalidateTag(`transactions_${user.team_id}`);

    return data;
  });
