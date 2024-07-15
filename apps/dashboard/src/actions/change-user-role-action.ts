"use server";

import { LogEvents } from "@midday/events/events";
import { setupAnalytics } from "@midday/events/server";
import { updateUserTeamRole } from "@midday/supabase/mutations";
import { revalidatePath as revalidatePathFunc } from "next/cache";
import { authActionClient } from "./safe-action";
import { changeUserRoleSchema } from "./schema";

export const changeUserRoleAction = authActionClient
  .schema(changeUserRoleSchema)
  .action(
    async ({
      parsedInput: {
        userId,
        teamId,
        role,
        revalidatePath,
        ctx: { supabase },
      },
    }) => {
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
    },
  );
