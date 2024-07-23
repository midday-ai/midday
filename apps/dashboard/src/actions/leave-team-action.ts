"use server";

import { LogEvents } from "@midday/events/events";
import { getTeamMembers } from "@midday/supabase/cached-queries";
import { leaveTeam } from "@midday/supabase/mutations";
import {
  revalidatePath as revalidatePathFunc,
  revalidateTag,
} from "next/cache";
import { redirect } from "next/navigation";
import { authActionClient } from "./safe-action";
import { leaveTeamSchema } from "./schema";

export const leaveTeamAction = authActionClient
  .schema(leaveTeamSchema)
  .metadata({
    name: "leave-team",
    track: {
      event: LogEvents.LeaveTeam.name,
      channel: LogEvents.LeaveTeam.channel,
    },
  })
  .action(
    async ({
      parsedInput: { teamId, role, redirectTo, revalidatePath },
      ctx: { user, supabase },
    }) => {
      const { data: teamMembersData } = await getTeamMembers();

      const totalOwners = teamMembersData.filter(
        (member) => member.role === "owner",
      ).length;

      if (role === "owner" && totalOwners === 1) {
        throw Error("Action not allowed");
      }

      const { data, error } = await leaveTeam(supabase, {
        teamId,
        userId: user.id,
      });

      revalidateTag(`user_${user.id}`);
      revalidateTag(`teams_${user.id}`);

      if (revalidatePath) {
        revalidatePathFunc(revalidatePath);
      }

      if (redirectTo) {
        redirect(redirectTo);
      }

      return data;
    },
  );
