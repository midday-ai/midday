"use server";

import { deleteUser } from "@midday/supabase/mutations";
import { createClient } from "@midday/supabase/server";
import { redirect } from "next/navigation";

export const deleteUserAction = async () => {
  const supabase = createClient({
    // NOTE: Needed for supabase.auth.admin
    admin: true,
  });

  await deleteUser(supabase);

  redirect("/");
};
