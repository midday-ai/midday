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
  .action(async ({ parsedInput: { teamId }, ctx: { user, supabase } }) => {
    const { data: teamData } = await supabase
      .from("teams")
      .delete()
      .eq("id", teamId)
      .select("id, bank_connections(access_token, provider, reference_id)")
      .single();

    await deleteTeam.trigger({
      teamId,
      connections: teamData?.bank_connections ?? [],
    });

    revalidateTag(`user_${user.id}`);
    revalidateTag(`teams_${user.id}`);

    return teamId;
  });
