"use server";

import { getUser } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import { deleteFolder } from "@midday/supabase/storage";
import { revalidateTag } from "next/cache";
import { action } from "./safe-action";
import { deleteInviteSchema } from "./schema";

export const deleteInviteAction = action(deleteInviteSchema, async ({ id }) => {
  const supabase = createClient();
  const user = await getUser();

  await supabase.from("user_invites").delete().eq("id", id);

  revalidateTag(`team_invites_${user.data.team_id}`);

  return id;
});
