"use server";

import { LogEvents } from "@midday/events/events";
import { setupLogSnag } from "@midday/events/server";
import { getUser } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import {
  revalidatePath as revalidatePathFunc,
  revalidateTag,
} from "next/cache";
import { action } from "./safe-action";
import { acceptInviteSchema } from "./schema";

export const acceptInviteAction = action(
  acceptInviteSchema,
  async ({ id, revalidatePath }) => {
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

    if (revalidatePath) {
      revalidatePathFunc(revalidatePath);
    }

    revalidateTag(`teams_${user.data.id}`);

    const logsnag = setupLogSnag();

    logsnag.track({
      event: LogEvents.AcceptInvite.name,
      icon: LogEvents.AcceptInvite.icon,
      user_id: user.data.email,
      channel: LogEvents.AcceptInvite.channel,
    });

    return id;
  }
);
