"use server";

import { createClient } from "@midday/supabase/server";
import { revalidateTag } from "next/cache";

export async function signOutAction() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  await supabase.auth.signOut({
    scope: "local",
  });

  revalidateTag(`user_${session.user.id}`);
}
