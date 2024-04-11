"use server";

import { LogEvents } from "@midday/events/events";
import { setupLogSnag } from "@midday/events/server";
import { deleteUser } from "@midday/supabase/mutations";
import { createClient } from "@midday/supabase/server";
import { redirect } from "next/navigation";

export const deleteUserAction = async () => {
  const supabase = createClient({
    // NOTE: Needed for supabase.auth.admin
    admin: true,
  });

  const userId = await deleteUser(supabase);

  const logsnag = setupLogSnag({
    userId,
  });

  logsnag.track({
    event: LogEvents.DeleteUser.name,
    icon: LogEvents.DeleteUser.icon,
    user_id: userId,
    channel: LogEvents.DeleteUser.channel,
  });

  redirect("/");
};
