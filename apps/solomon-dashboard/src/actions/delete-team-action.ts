"use server";

import { LogEvents } from "@midday/events/events";
import { setupAnalytics } from "@midday/events/server";
import { getUser } from "@midday/supabase/cached-queries";
import { deleteTeam } from "@midday/supabase/mutations";
import { createClient } from "@midday/supabase/server";
import { revalidateTag } from "next/cache";
import { action } from "./safe-action";
import { deleteTeamSchema } from "./schema";

export const deleteTeamAction = action(deleteTeamSchema, async ({ teamId }) => {
  const supabase = createClient();
  const user = await getUser();

  const { data } = await deleteTeam(supabase, teamId);

  revalidateTag(`user_${user.data.id}`);
  revalidateTag(`teams_${user.data.id}`);

  const analytics = await setupAnalytics({
    userId: user.data.id,
    fullName: user.data.full_name,
  });

  analytics.track({
    event: LogEvents.DeleteTeam.name,
    channel: LogEvents.DeleteTeam.channel,
  });

  return data;
});
