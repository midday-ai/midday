"use server";

import { getUser } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import { revalidateTag } from "next/cache";
import { action } from "./safe-action";
import { declineInviteSchema } from "./schema";

export const declineInviteAction = action(
  declineInviteSchema,
  async ({ id }) => {
    const supabase = createClient();
    const user = await getUser();

    await supabase.from("user_invites").delete().eq("id", id);
    revalidateTag(`team_invites_${user.data.team_id}`);

    return id;
  }
);
