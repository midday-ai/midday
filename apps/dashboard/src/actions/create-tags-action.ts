"use server";

import { LogEvents } from "@midday/events/events";
import { authActionClient } from "./safe-action";
import { createTagsSchema } from "./schema";

export const createTagsAction = authActionClient
  .schema(createTagsSchema)
  .metadata({
    name: "create-tags",
    track: {
      event: LogEvents.CreateTag.name,
      channel: LogEvents.CreateTag.channel,
    },
  })
  .action(async ({ parsedInput: tags, ctx: { user, supabase } }) => {
    const { data, error } = await supabase
      .from("transaction_tags")
      .insert(tags.map((tag) => ({ name: tag.name, team_id: user.team_id })));

    console.log(error);
    return data;
  });
