"use server";

import { updateUser } from "@midday/supabase/mutations";
import { createClient } from "@midday/supabase/server";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { action } from "./safe-action";
import { changeTeamSchema } from "./schema";

export const changeTeamAction = action(
  changeTeamSchema,
  async ({ teamId, redirectTo }) => {
    const supabase = createClient();
    const user = await updateUser(supabase, { team_id: teamId });

    revalidateTag(`user_${user.data.id}`);

    redirect(redirectTo);
  }
);
