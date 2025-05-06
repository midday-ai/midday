"use server";

import { setTeamId } from "@/utils/team";
import { LogEvents } from "@midday/events/events";
import { updateUser } from "@midday/supabase/mutations";
import { redirect } from "next/navigation";
import { z } from "zod";
import { authActionClient } from "./safe-action";

export const changeTeamAction = authActionClient
  .schema(
    z.object({
      teamId: z.string(),
      redirectTo: z.string(),
    }),
  )
  .metadata({
    name: "change-team",
    track: {
      event: LogEvents.ChangeTeam.name,
      channel: LogEvents.ChangeTeam.channel,
    },
  })
  .action(
    async ({
      parsedInput: { teamId, redirectTo },
      ctx: { supabase, user },
    }) => {
      await setTeamId(teamId);

      await updateUser(supabase, {
        id: user.id,
        team_id: teamId,
      });

      redirect(redirectTo);
    },
  );
