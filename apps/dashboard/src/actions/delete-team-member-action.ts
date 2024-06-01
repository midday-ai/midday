"use server";

import { LogEvents } from "@midday/events/events";
import { setupAnalytics } from "@midday/events/server";
import { getUser } from "@midday/supabase/cached-queries";
import { deleteTeamMember } from "@midday/supabase/mutations";
import { createClient } from "@midday/supabase/server";
import { revalidatePath as revalidatePathFunc } from "next/cache";
import { action } from "./safe-action";
import { deleteTeamMemberSchema } from "./schema";

export const deleteTeamMemberAction = action(
  deleteTeamMemberSchema,
  async ({ revalidatePath, teamId, userId }) => {
    const supabase = createClient();
    const user = await getUser();
    const { data } = await deleteTeamMember(supabase, { teamId, userId });

    if (revalidatePath) {
      revalidatePathFunc(revalidatePath);
    }

    const analytics = await setupAnalytics({
      userId: user.data.id,
      fullName: user.data.full_name,
    });

    analytics.track({
      event: LogEvents.DeleteTeamMember.name,
      channel: LogEvents.DeleteTeamMember.channel,
    });

    return data;
  }
);
