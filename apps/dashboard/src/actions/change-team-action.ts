"use server";

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
    async ({ parsedInput: { teamId, redirectTo }, ctx: { supabase } }) => {
      const user = await updateUser(supabase, { team_id: teamId });

      if (!user?.data) {
        return;
      }

      revalidateTag(`user_${user.data.id}`);

      redirect(redirectTo);
    },
  );
