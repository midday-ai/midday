"use server";

import { getUser } from "@midday/supabase/cached-queries";
import { deleteTeam } from "@midday/supabase/mutations";
import { createClient } from "@midday/supabase/server";
import { revalidateTag } from "next/cache";
import { action } from "./safe-action";
import { deleteTeamSchema } from "./schema";

export const deleteTeamAction = action(deleteTeamSchema, async ({ teamId }) => {
  const supabase = createClient();
  const user = await getUser();

  const { data } = await deleteTeam(supabase, teamId);

  revalidateTag(`user_${user.data.id}`);
  revalidateTag(`teams_${user.data.id}`);

  return data;
});
