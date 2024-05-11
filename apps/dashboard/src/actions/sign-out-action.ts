"use server";

import { LogEvents } from "@midday/events/events";
import { setupLogSnag } from "@midday/events/server";
import { createClient } from "@midday/supabase/server";
import { revalidateTag } from "next/cache";

export async function signOutAction() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  await supabase.auth.signOut({
    scope: "local",
  });

  const logsnag = await setupLogSnag({
    userId: session?.user.id,
    fullName: session?.user.user_metadata?.full_name,
  });

  logsnag.track({
    event: LogEvents.SignOut.name,
    icon: LogEvents.SignOut.icon,
    channel: LogEvents.SignOut.channel,
  });

  revalidateTag(`user_${session?.user.id}`);
}
