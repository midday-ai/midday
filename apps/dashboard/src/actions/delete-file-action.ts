"use server";

import { LogEvents } from "@midday/events/events";
import { setupLogSnag } from "@midday/events/server";
import { getUser } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import { remove } from "@midday/supabase/storage";
import { revalidateTag } from "next/cache";
import { action } from "./safe-action";
import { deleteFileSchema } from "./schema";

export const deleteFileAction = action(deleteFileSchema, async (value) => {
  const supabase = createClient();
  const user = await getUser();

  await remove(supabase, {
    bucket: "vault",
    path: [user.data.team_id, ...value.path],
  });

  await revalidateTag(`vault_${user.data.team_id}`);

  const logsnag = setupLogSnag();

  logsnag.track({
    event: LogEvents.DeleteFile.name,
    icon: LogEvents.DeleteFile.icon,
    user_id: user.data.id,
    channel: LogEvents.DeleteFile.channel,
  });

  return value;
});
