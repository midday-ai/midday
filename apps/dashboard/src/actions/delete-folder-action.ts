"use server";

import { LogEvents } from "@midday/events/events";
import { setupLogSnag } from "@midday/events/server";
import { getUser } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import { deleteFolder } from "@midday/supabase/storage";
import { revalidateTag } from "next/cache";
import { action } from "./safe-action";
import { deleteFolderSchema } from "./schema";

export const deleteFolderAction = action(deleteFolderSchema, async (value) => {
  const supabase = createClient();
  const user = await getUser();

  await deleteFolder(supabase, {
    bucket: "vault",
    path: [user.data.team_id, ...value.path],
  });

  await revalidateTag(`vault_${user.data.team_id}`);

  const logsnag = setupLogSnag({
    userId: user.data.id,
    fullName: user.data.full_name,
  });

  logsnag.track({
    event: LogEvents.DeleteFolder.name,
    icon: LogEvents.DeleteFolder.icon,
    channel: LogEvents.DeleteFolder.channel,
  });

  return value;
});
