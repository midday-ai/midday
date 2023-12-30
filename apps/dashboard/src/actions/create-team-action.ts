"use server";

import { createTeam, updateUser } from "@midday/supabase/mutations";
import { createClient } from "@midday/supabase/server";
import { revalidateTag } from "next/cache";
import { action } from "./safe-action";
import { createTeamSchema } from "./schema";

export const createTeamAction = action(createTeamSchema, async ({ name }) => {
  const supabase = createClient();
  const { team_id } = await createTeam(supabase, { name });
  const user = await updateUser(supabase, { team_id });

  revalidateTag(`user_${user.data.id}`);
  revalidateTag(`teams_${user.data.id}`);

  return team_id;
});
