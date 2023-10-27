"use server";

import { deleteUser } from "@midday/supabase/mutations";
import { createClient } from "@midday/supabase/server";

export const deleteUserAction = async () => {
  const supabase = createClient();

  return deleteUser(supabase);
};
