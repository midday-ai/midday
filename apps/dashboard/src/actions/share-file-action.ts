"use server";

import { LogEvents } from "@midday/events/events";
import { setupAnalytics } from "@midday/events/server";
import { getUser } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import { share } from "@midday/supabase/storage";
import { Dub } from "dub";
import { action } from "./safe-action";
import { shareFileSchema } from "./schema";

const dub = new Dub({ projectSlug: "midday" });

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

  const analytics = await setupAnalytics({
    userId: user.data.id,
    fullName: user.data.full_name,
  });

  analytics.track({
    event: LogEvents.ShareFile.name,
    channel: LogEvents.ShareFile.channel,
  });

  const link = await dub.links.create({
    url: response?.data?.signedUrl,
    // rewrite: true,
  });

  return link?.shortLink;
});
