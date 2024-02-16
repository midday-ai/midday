"use server";

import { LogEvents } from "@midday/events/events";
import { logsnag } from "@midday/events/server";
import { getUser } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import { revalidatePath as revalidatePathFunc } from "next/cache";
import { action } from "./safe-action";
import { deleteInviteSchema } from "./schema";

export const deleteInviteAction = action(
  deleteInviteSchema,
  async ({ id, revalidatePath }) => {
    const supabase = createClient();
    const user = await getUser();

    await supabase.from("user_invites").delete().eq("id", id);

    if (revalidatePath) {
      revalidatePathFunc(revalidatePath);
    }

    logsnag.track({
      event: LogEvents.DeleteInvite.name,
      icon: LogEvents.DeleteInvite.icon,
      user_id: user.data.id,
      channel: LogEvents.DeleteInvite.channel,
    });

    return id;
  }
);
