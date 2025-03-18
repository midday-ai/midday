"use server";

import { LogEvents } from "@midday/events/events";
import { getCurrency } from "@midday/location";
import { createTeam, updateUser } from "@midday/supabase/mutations";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { authActionClient } from "./safe-action";
import { createTeamSchema } from "./schema";

export const createTeamAction = authActionClient
  .schema(createTeamSchema)
  .metadata({
    name: "create-team",
    track: {
      event: LogEvents.CreateTeam.name,
      channel: LogEvents.CreateTeam.channel,
    },
  })
  .action(async ({ parsedInput: { name, redirectTo }, ctx: { supabase } }) => {
    const currency = getCurrency();
    const team_id = await createTeam(supabase, { name, currency });
    const user = await updateUser(supabase, { team_id });

    if (!user?.data) {
      return;
    }

    revalidateTag(`user_${user.data.id}`);
    revalidateTag(`teams_${user.data.id}`);

    if (redirectTo) {
      redirect(redirectTo);
    }

    return team_id;
  });
