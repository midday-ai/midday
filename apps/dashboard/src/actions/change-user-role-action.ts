"use server";

import { getTeamUser } from "@midday/supabase/cached-queries";
import { updateUserTeamRole } from "@midday/supabase/mutations";
import { createClient } from "@midday/supabase/server";
import { revalidateTag } from "next/cache";
import { action } from "./safe-action";
import { changeUserRoleSchema } from "./schema";

export const changeUserRoleAction = action(
  changeUserRoleSchema,
  async (payload) => {
    const supabase = createClient();
    const { data: userData } = await getTeamUser();

    if (userData.role !== "admin") {
      // Error
      return;
    }

    const { data } = await updateUserTeamRole(supabase, payload);

    revalidateTag(`team_members_${data.team_id}`);

    return data;
  }
);
