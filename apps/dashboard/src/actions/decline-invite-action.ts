"use server";

import { LogEvents } from "@midday/events/events";
import { revalidatePath as revalidatePathFunc } from "next/cache";
import { authActionClient } from "./safe-action";
import { declineInviteSchema } from "./schema";

export const declineInviteAction = authActionClient
  .schema(declineInviteSchema)
  .metadata({
    name: "decline-invite",
    track: {
      event: LogEvents.DeclineInvite.name,
      channel: LogEvents.DeclineInvite.channel,
    },
  })
  .action(
    async ({ parsedInput: { id, revalidatePath }, ctx: { supabase } }) => {
      const data = await supabase
        .from("user_invites")
        .delete()
        .eq("id", id)
        .select();

      if (revalidatePath) {
        revalidatePathFunc(revalidatePath);
      }

      return data;
    },
  );
