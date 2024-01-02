"use server";

import { updateUserTeamRole } from "@midday/supabase/mutations";
import { createClient } from "@midday/supabase/server";
import { revalidateTag } from "next/cache";
import { action } from "./safe-action";
import { changeUserRoleSchema } from "./schema";

export const changeUserRoleAction = action(
  changeUserRoleSchema,
  async (payload) => {
    const supabase = createClient();

    const { data } = await updateUserTeamRole(supabase, payload);

    revalidateTag(`team_members_${payload.teamId}`);

    return data;
  }
);
