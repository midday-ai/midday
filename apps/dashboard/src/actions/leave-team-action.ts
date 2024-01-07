"use server";

import { getTeamMembers, getUser } from "@midday/supabase/cached-queries";
import { leaveTeam } from "@midday/supabase/mutations";
import { createClient } from "@midday/supabase/server";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { action } from "./safe-action";
import { leaveTeamSchema } from "./schema";

export const leaveTeamAction = action(
  leaveTeamSchema,
  async ({ teamId, role, redirectTo }) => {
    const supabase = createClient();
    const user = await getUser();
    const { data: teamMembersData } = await getTeamMembers();

    const totalOwners = teamMembersData.filter(
      (member) => member.role === "owner"
    ).length;

    if (role === "owner" && totalOwners === 1) {
      throw Error("Action not allowed");
    }

    const { data } = await leaveTeam(supabase, {
      teamId,
      userId: user.data.id,
    });

    revalidateTag(`team_members_${data.team_id}`);
    revalidateTag(`user_${user.data.id}`);
    revalidateTag(`teams_${user.data.id}`);

    if (redirectTo) {
      redirect(redirectTo);
    }

    return data;
  }
);
