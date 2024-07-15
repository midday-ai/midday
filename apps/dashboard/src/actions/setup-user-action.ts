"use server";

import { updateTeam, updateUser } from "@midday/supabase/mutations";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { authActionClient } from "./safe-action";
import { setupUserSchema } from "./schema";

export const setupUserAction = authActionClient
  .schema(setupUserSchema)
  .action(
    async ({
      parsedInput: { full_name, team_name },
      ctx: { user, supabase },
    }) => {
      await Promise.all([
        // Update supabase auth user
        supabase.auth.updateUser({
          data: { full_name },
        }),
        // Update our user in table
        updateUser(supabase, {
          full_name,
        }),
        updateTeam(supabase, {
          name: team_name,
        }),
      ]);

      revalidateTag(`user_${user.id}`);
      revalidateTag(`team_${user.team_id}`);

      redirect("/");
    },
  );
