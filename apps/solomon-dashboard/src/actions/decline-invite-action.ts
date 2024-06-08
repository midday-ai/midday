"use server";

import { LogEvents } from "@midday/events/events";
import { setupAnalytics } from "@midday/events/server";
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

    const analytics = await setupAnalytics({
      userId: user.data.id,
      fullName: user.data.full_name,
    });

    analytics.track({
      event: LogEvents.DeclineInvite.name,
      channel: LogEvents.DeclineInvite.channel,
    });

    return id;
  }
);
