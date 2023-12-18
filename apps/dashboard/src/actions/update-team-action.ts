"use server";

import { updateTeam } from "@midday/supabase/mutations";
import { createClient } from "@midday/supabase/server";
import { revalidatePath as revalidatePathFunc } from "next/cache";
import { action } from "./safe-action";
import { updateTeamSchema } from "./schema";

export const updateTeamAction = action(
  updateTeamSchema,
  async ({ revalidatePath, ...data }) => {
    const supabase = createClient();
    const team = await updateTeam(supabase, data);

    revalidatePathFunc(revalidatePath);

    return team;
  }
);
