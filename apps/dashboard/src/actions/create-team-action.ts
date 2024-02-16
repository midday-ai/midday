"use server";

import { LogEvents } from "@midday/events/events";
import { logsnag } from "@midday/events/server";
import { createTeam, updateUser } from "@midday/supabase/mutations";
import { createClient } from "@midday/supabase/server";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { action } from "./safe-action";
import { createTeamSchema } from "./schema";

export const createTeamAction = action(
  createTeamSchema,
  async ({ name, redirectTo }) => {
    const supabase = createClient();
    const { team_id } = await createTeam(supabase, { name });
    const user = await updateUser(supabase, { team_id });

    revalidateTag(`user_${user.data.id}`);
    revalidateTag(`teams_${user.data.id}`);

    logsnag.track({
      event: LogEvents.CreateTeam.name,
      icon: LogEvents.CreateTeam.icon,
      user_id: user.data.email,
      channel: LogEvents.CreateTeam.channel,
    });

    if (redirectTo) {
      redirect(redirectTo);
    }

    return team_id;
  }
);
