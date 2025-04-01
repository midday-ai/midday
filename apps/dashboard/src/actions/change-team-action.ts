"use server";

import { setTeamId } from "@/utils/team";
import { LogEvents } from "@midday/events/events";
import { updateUser } from "@midday/supabase/mutations";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
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

      const { data } = await updateUser(supabase, {
        id: user.id,
        team_id: teamId,
      });

      if (!data) {
        return;
      }

      revalidateTag(`user_${data.id}`);

      redirect(redirectTo);
    },
  );
