"use server";

import { LogEvents } from "@midday/events/events";
import { deleteTeam } from "jobs/tasks/team/delete";
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
  .action(async ({ parsedInput: { teamId }, ctx: { user } }) => {
    await deleteTeam.triggerAndWait({
      teamId,
    });

    revalidateTag(`user_${user.id}`);
    revalidateTag(`teams_${user.id}`);

    return teamId;
  });
