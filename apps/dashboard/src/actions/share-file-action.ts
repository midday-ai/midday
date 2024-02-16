"use server";

import { LogEvents } from "@midday/events/events";
import { logsnag } from "@midday/events/server";
import { getUser } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import { share } from "@midday/supabase/storage";
import { action } from "./safe-action";
import { shareFileSchema } from "./schema";

export const shareFileAction = action(shareFileSchema, async (value) => {
  const supabase = createClient();
  const user = await getUser();

  const response = await share(supabase, {
    bucket: "vault",
    path: `${user.data.team_id}/${value.filepath}`,
    expireIn: value.expireIn,
    options: {
      download: true,
    },
  });

  logsnag.track({
    event: LogEvents.ShareFile.name,
    icon: LogEvents.ShareFile.icon,
    user_id: user.data.id,
    channel: LogEvents.ShareFile.channel,
  });

  return response?.data?.signedUrl;
});
