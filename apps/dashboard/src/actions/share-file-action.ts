"use server";

import { dub } from "@/utils/dub";
import { LogEvents } from "@midday/events/events";
import { signedUrl } from "@midday/supabase/storage";
import { z } from "zod";
import { authActionClient } from "./safe-action";

export const shareFileAction = authActionClient
  .schema(
    z.object({
      fullPath: z.string(),
      expireIn: z.number(),
    }),
  )
  .metadata({
    name: "share-file",
    track: {
      event: LogEvents.ShareFile.name,
      channel: LogEvents.ShareFile.channel,
    },
  })
  .action(async ({ parsedInput: value, ctx: { supabase } }) => {
    const response = await signedUrl(supabase, {
      bucket: "vault",
      path: value.fullPath,
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
