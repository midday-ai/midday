"use server";

import { LogEvents } from "@midday/events/events";
import { setupLogSnag } from "@midday/events/server";
import { getUser } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import { revalidatePath as revalidatePathFunc } from "next/cache";
import { action } from "./safe-action";
import { declineInviteSchema } from "./schema";

export const declineInviteAction = action(
  declineInviteSchema,
  async ({ id, revalidatePath }) => {
    const supabase = createClient();
    const user = await getUser();

    await supabase.from("user_invites").delete().eq("id", id);

    if (revalidatePath) {
      revalidatePathFunc(revalidatePath);
    }

    const logsnag = setupLogSnag();

    logsnag.track({
      event: LogEvents.DeclineInvite.name,
      icon: LogEvents.DeclineInvite.icon,
      user_id: user.data.email,
      channel: LogEvents.DeclineInvite.channel,
    });

    return id;
  }
);
