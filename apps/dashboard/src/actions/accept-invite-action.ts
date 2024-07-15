"use server";

import { LogEvents } from "@midday/events/events";
import { setupAnalytics } from "@midday/events/server";
import { createClient } from "@midday/supabase/server";
import {
  revalidatePath as revalidatePathFunc,
  revalidateTag,
} from "next/cache";
import { authActionClient } from "./safe-action";
import { acceptInviteSchema } from "./schema";

export const acceptInviteAction = authActionClient
  .schema(acceptInviteSchema)
  .action(async ({ parsedInput: { id, revalidatePath }, ctx: { user } }) => {
    const supabase = createClient();

    const { data: inviteData } = await supabase
      .from("user_invites")
      .select("*")
      .eq("id", id)
      .single();

    if (!inviteData) {
      return;
    }

    await supabase.from("users_on_team").insert({
      user_id: user.id,
      role: inviteData.role,
      team_id: user.team_id as string,
    });

    await supabase.from("user_invites").delete().eq("id", id);

    if (revalidatePath) {
      revalidatePathFunc(revalidatePath);
    }

    revalidateTag(`teams_${user.id}`);

    const analytics = await setupAnalytics({
      userId: user.id,
      fullName: user.full_name,
    });

    analytics.track({
      event: LogEvents.AcceptInvite.name,
      channel: LogEvents.AcceptInvite.channel,
    });

    return id;
  });
