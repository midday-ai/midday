"use server";

import { updateTeam, updateUser } from "@midday/supabase/mutations";
import { createClient } from "@midday/supabase/server";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { action } from "./safe-action";
import { setupUserSchema } from "./schema";

export const setupUserAction = action(
  setupUserSchema,
  async ({ full_name, team_name }) => {
    const supabase = createClient();

    // Update supabase auth user
    const { data: userData } = await supabase.auth.updateUser({
      data: { full_name },
    });

    // Update our user in table
    await updateUser(supabase, {
      full_name,
    });

    const { data: teamData } = await updateTeam(supabase, {
      name: team_name,
    });

    revalidateTag(`user_${userData?.id}`);
    revalidateTag(`team_${teamData.id}`);

    redirect("/");
  }
);
