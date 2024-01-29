"use server";

import { deleteTeamMember } from "@midday/supabase/mutations";
import { createClient } from "@midday/supabase/server";
import { action } from "./safe-action";
import { deleteTeamMemberSchema } from "./schema";

export const deleteTeamMemberAction = action(
  deleteTeamMemberSchema,
  async (params) => {
    const supabase = createClient();

    const { data } = await deleteTeamMember(supabase, params);

    return data;
  }
);
