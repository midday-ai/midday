"use server";

import { LogEvents } from "@midday/events/events";
import { setupLogSnag } from "@midday/events/server";
import { getUser } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import { createFolder } from "@midday/supabase/storage";
import { revalidateTag } from "next/cache";
import { action } from "./safe-action";
import { createFolderSchema } from "./schema";

export const createFolderAction = action(createFolderSchema, async (value) => {
  const supabase = createClient();
  const user = await getUser();

  await createFolder(supabase, {
    bucket: "vault",
    path: [user.data.team_id, value.path],
    name: value.name,
  });

  await revalidateTag(`vault_${user.data.team_id}`);

  const logsnag = setupLogSnag();

  logsnag.track({
    event: LogEvents.CreateFolder.name,
    icon: LogEvents.CreateFolder.icon,
    user_id: user.data.email,
    channel: LogEvents.CreateFolder.channel,
  });
});
