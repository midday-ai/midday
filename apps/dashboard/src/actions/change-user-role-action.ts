"use server";

import { LogEvents } from "@midday/events/events";
import { setupAnalytics } from "@midday/events/server";
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

    const analytics = await setupAnalytics({
      userId,
    });

    analytics.track({
      event: LogEvents.UserRoleChange.name,
      channel: LogEvents.UserRoleChange.channel,
    });

    return data;
  }
);
