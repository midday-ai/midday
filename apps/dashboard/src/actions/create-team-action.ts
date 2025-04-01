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
  .action(
    async ({ parsedInput: { name, redirectTo }, ctx: { supabase, user } }) => {
      const currency = await getCurrency();
      const team_id = await createTeam(supabase, { name, currency });
      const { data } = await updateUser(supabase, { id: user.id, team_id });

      if (!data) {
        return;
      }

      revalidateTag(`user_${data.id}`);
      revalidateTag(`teams_${data.id}`);

      if (redirectTo) {
        redirect(redirectTo);
      }

      return team_id;
    },
  );
