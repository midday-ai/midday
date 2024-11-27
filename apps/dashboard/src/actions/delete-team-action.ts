"use server";

import { LogEvents } from "@midday/events/events";
import { revalidateTag } from "next/cache";
import { authActionClient } from "./safe-action";
import { deleteTeamSchema } from "./schema";

export const deleteTeamAction = authActionClient
  .schema(deleteTeamSchema)
  .metadata({
    name: "delete-team",
    track: {
      event: LogEvents.DeleteTeam.name,
      channel: LogEvents.DeleteTeam.channel,
    },
  })
  .action(async ({ parsedInput: { teamId }, ctx: { user, supabase } }) => {
    // Run trigger

    revalidateTag(`user_${user.id}`);
    revalidateTag(`teams_${user.id}`);

    // return data;
  });
