"use server";

import { deleteTeam } from "@midday/supabase/mutations";
import { createClient } from "@midday/supabase/server";

export const deleteTeamAction = async () => {
  const supabase = createClient();

  return deleteTeam(supabase);
};
