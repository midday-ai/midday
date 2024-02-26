"use server";

import { LogEvents } from "@midday/events/events";
import { logsnag } from "@midday/events/server";
import { createClient } from "@midday/supabase/server";
import { revalidateTag } from "next/cache";

export async function signOutAction() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.auth.signOut({
    scope: "local",
  });

  logsnag.track({
    event: LogEvents.SignOut.name,
    icon: LogEvents.SignOut.icon,
    user_id: user.id,
    channel: LogEvents.SignOut.channel,
  });

  revalidateTag(`user_${user.id}`);
}
