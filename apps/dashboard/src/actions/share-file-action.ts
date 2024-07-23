"use server";

import { LogEvents } from "@midday/events/events";
import { share } from "@midday/supabase/storage";
import { Dub } from "dub";
import { authActionClient } from "./safe-action";
import { shareFileSchema } from "./schema";

const dub = new Dub({ projectSlug: "midday" });

export const shareFileAction = authActionClient
  .schema(shareFileSchema)
  .metadata({
    name: "share-file",
    track: {
      event: LogEvents.ShareFile.name,
      channel: LogEvents.ShareFile.channel,
    },
  })
  .action(async ({ parsedInput: value, ctx: { supabase, user } }) => {
    const response = await share(supabase, {
      bucket: "vault",
      path: `${user.team_id}/${value.filepath}`,
      expireIn: value.expireIn,
      options: {
        download: true,
      },
    });

    if (!response.data) {
      return null;
    }

    const link = await dub.links.create({
      url: response?.data?.signedUrl,
    });

    return link?.shortLink;
  });
