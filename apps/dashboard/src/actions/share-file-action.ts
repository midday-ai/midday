"use server";

import { dub } from "@/utils/dub";
import { LogEvents } from "@absplatform/events/events";
import { share } from "@absplatform/supabase/storage";
import { authActionClient } from "./safe-action";
import { shareFileSchema } from "./schema";

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
