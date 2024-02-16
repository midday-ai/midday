"use server";

import { LogEvents } from "@midday/events/events";
import { logsnag } from "@midday/events/server";
import { getTeamMembers, getUser } from "@midday/supabase/cached-queries";
import { leaveTeam } from "@midday/supabase/mutations";
import { createClient } from "@midday/supabase/server";
import {
  revalidatePath as revalidatePathFunc,
  revalidateTag,
} from "next/cache";
import { redirect } from "next/navigation";
import { action } from "./safe-action";
import { leaveTeamSchema } from "./schema";

export const leaveTeamAction = action(
  leaveTeamSchema,
  async ({ teamId, role, redirectTo, revalidatePath }) => {
    const supabase = createClient();
    const user = await getUser();
    const { data: teamMembersData } = await getTeamMembers();

    const totalOwners = teamMembersData.filter(
      (member) => member.role === "owner"
    ).length;

    if (role === "owner" && totalOwners === 1) {
      throw Error("Action not allowed");
    }

    const { data, error } = await leaveTeam(supabase, {
      teamId,
      userId: user.data.id,
    });

    revalidateTag(`user_${user.data.id}`);
    revalidateTag(`teams_${user.data.id}`);

    if (revalidatePath) {
      revalidatePathFunc(revalidatePath);
    }

    if (redirectTo) {
      redirect(redirectTo);
    }

    logsnag.track({
      event: LogEvents.LeaveTeam.name,
      icon: LogEvents.LeaveTeam.icon,
      user_id: user.data.id,
      channel: LogEvents.LeaveTeam.channel,
    });

    return data;
  }
);
