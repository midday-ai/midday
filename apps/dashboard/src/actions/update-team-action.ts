"use server";

import { updateTeam } from "@midday/supabase/mutations";
import {
  revalidatePath as revalidatePathFunc,
  revalidateTag,
} from "next/cache";
import { authActionClient } from "./safe-action";
import { updateTeamSchema } from "./schema";

export const updateTeamAction = authActionClient
  .schema(updateTeamSchema)
  .metadata({
    name: "update-team",
  })
  .action(
    async ({
      parsedInput: { revalidatePath, ...data },
      ctx: { user, supabase },
    }) => {
      const team = await updateTeam(supabase, data);

      if (revalidatePath) {
        revalidatePathFunc(revalidatePath);
      }

      revalidateTag(`user_${user.id}`);

      return team;
    },
  );
