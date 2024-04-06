"use server";

import { LogEvents } from "@midday/events/events";
import { setupLogSnag } from "@midday/events/server";
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

    const logsnag = setupLogSnag();

    logsnag.track({
      event: LogEvents.DeleteTeamMember.name,
      icon: LogEvents.DeleteTeamMember.icon,
      user_id: user.data.id,
      channel: LogEvents.DeleteTeamMember.channel,
    });

    return data;
  }
);
