"use server";

import { LogEvents } from "@midday/events/events";
import { setupLogSnag } from "@midday/events/server";
import { updateUserTeamRole } from "@midday/supabase/mutations";
import { createClient } from "@midday/supabase/server";
import { revalidatePath as revalidatePathFunc } from "next/cache";
import { action } from "./safe-action";
import { changeUserRoleSchema } from "./schema";

export const changeUserRoleAction = action(
  changeUserRoleSchema,
  async ({ userId, teamId, role, revalidatePath }) => {
    const supabase = createClient();

    const { data } = await updateUserTeamRole(supabase, {
      userId,
      teamId,
      role,
    });

    if (revalidatePath) {
      revalidatePathFunc(revalidatePath);
    }

    const logsnag = setupLogSnag();

    logsnag.track({
      event: LogEvents.UserRoleChange.name,
      icon: LogEvents.UserRoleChange.icon,
      user_id: userId,
      channel: LogEvents.UserRoleChange.channel,
    });

    return data;
  }
);
