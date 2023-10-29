"use server";

import { updateTeam } from "@midday/supabase/mutations";
import { createClient } from "@midday/supabase/server";
import { revalidatePath } from "next/cache";
import { action } from "./safe-action";
import { updateTeamSchema } from "./schema";

export const updateTeamAction = action(
  updateTeamSchema,
  async ({ path, ...data }) => {
    const supabase = createClient();
    const team = await updateTeam(supabase, data);

    revalidatePath(path);

    return team;
  },
);
