"use server";

import { deleteTeamMember } from "@midday/supabase/mutations";
import { createClient } from "@midday/supabase/server";
import { revalidatePath as revalidatePathFunc } from "next/cache";
import { action } from "./safe-action";
import { deleteTeamMemberSchema } from "./schema";

export const deleteTeamMemberAction = action(
  deleteTeamMemberSchema,
  async ({ revalidatePath, teamId, userId }) => {
    const supabase = createClient();

    const { data } = await deleteTeamMember(supabase, { teamId, userId });

    if (revalidatePath) {
      revalidatePathFunc(revalidatePath);
    }

    return data;
  }
);
