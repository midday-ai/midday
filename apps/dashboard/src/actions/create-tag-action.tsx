"use server";

import { LogEvents } from "@midday/events/events";
import { authActionClient } from "./safe-action";
import { createTagSchema } from "./schema";

export const createTagAction = authActionClient
  .schema(createTagSchema)
  .metadata({
    name: "create-tag",
    track: {
      event: LogEvents.CreateTag.name,
      channel: LogEvents.CreateTag.channel,
    },
  })
  .action(async ({ parsedInput: { name }, ctx: { user, supabase } }) => {
    const { data } = await supabase
      .from("tags")
      .insert({
        name,
        team_id: user.team_id!,
      })
      .select("id, name")
      .single();

    return data;
  });
