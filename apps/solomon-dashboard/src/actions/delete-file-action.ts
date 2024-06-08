"use server";

import { LogEvents } from "@midday/events/events";
import { setupAnalytics } from "@midday/events/server";
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

  const analytics = await setupAnalytics({
    userId: user.data.id,
    fullName: user.data.full_name,
  });

  analytics.track({
    event: LogEvents.DeleteFile.name,
    channel: LogEvents.DeleteFile.channel,
  });

  return value;
});
