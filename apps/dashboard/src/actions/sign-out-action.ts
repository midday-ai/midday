"use server";

import { LogEvents } from "@midday/events/events";
import { logsnag } from "@midday/events/server";
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

  logsnag.track({
    event: LogEvents.SignOut.name,
    icon: LogEvents.SignOut.icon,
    user_id: session.user.id,
    channel: LogEvents.SignOut.channel,
  });

  revalidateTag(`user_${session.user.id}`);
}
