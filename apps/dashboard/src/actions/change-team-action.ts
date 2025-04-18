"use server";

import { setTeamId } from "@/utils/team";
import { LogEvents } from "@midday/events/events";
import { updateUser } from "@midday/supabase/mutations";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { authActionClient } from "./safe-action";
import { changeTeamSchema } from "./schema";

export const changeTeamAction = authActionClient
  .schema(changeTeamSchema)
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

      // Update user team_id after redirect
      after(async () => {
        await updateUser(supabase, {
          id: user.id,
          team_id: teamId,
        });
      });

      redirect(redirectTo);
    },
  );
