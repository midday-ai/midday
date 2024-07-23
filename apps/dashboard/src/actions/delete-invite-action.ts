"use server";

import { LogEvents } from "@midday/events/events";
import { revalidatePath as revalidatePathFunc } from "next/cache";
import { authActionClient } from "./safe-action";
import { deleteInviteSchema } from "./schema";

export const deleteInviteAction = authActionClient
  .schema(deleteInviteSchema)
  .metadata({
    name: "delete-invite",
    track: {
      event: LogEvents.DeleteInvite.name,
      channel: LogEvents.DeleteInvite.channel,
    },
  })
  .action(
    async ({ parsedInput: { id, revalidatePath }, ctx: { supabase } }) => {
      await supabase.from("user_invites").delete().eq("id", id);

      if (revalidatePath) {
        revalidatePathFunc(revalidatePath);
      }

      return id;
    },
  );
