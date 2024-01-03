"use server";

import { getUser } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import { revalidateTag } from "next/cache";
import { action } from "./safe-action";
import { acceptInviteSchema } from "./schema";

export const acceptInviteAction = action(acceptInviteSchema, async ({ id }) => {
  const supabase = createClient();
  const user = await getUser();

  const { data: inviteData } = await supabase
    .from("user_invites")
    .select("*")
    .eq("id", id)
    .single();

  await supabase.from("users_on_team").insert({
    user_id: user.data.id,
    role: inviteData.role,
    team_id: inviteData.team_id,
  });

  await supabase.from("user_invites").delete().eq("id", id);

  revalidateTag(`team_invites_${user.data.team_id}`);
  revalidateTag(`user_invites_${user.data.email}`);
  revalidateTag(`teams_${user.data.id}`);

  return id;
});
