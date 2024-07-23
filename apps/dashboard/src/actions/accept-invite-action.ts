"use server";

import { LogEvents } from "@midday/events/events";
import {
  revalidatePath as revalidatePathFunc,
  revalidateTag,
} from "next/cache";
import { authActionClient } from "./safe-action";
import { acceptInviteSchema } from "./schema";

export const acceptInviteAction = authActionClient
  .schema(acceptInviteSchema)
  .metadata({
    name: "accept-invite",
    track: {
      event: LogEvents.AcceptInvite.name,
      channel: LogEvents.AcceptInvite.channel,
    },
  })
  .action(
    async ({
      parsedInput: { id, revalidatePath },
      ctx: { user, supabase },
    }) => {
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

      return id;
    },
  );
