"use server";

import { authActionClient } from "@/actions/safe-action";
import { dub } from "@/lib/dub";
import { shareLinkSchema } from "./schema";

export const shareLinkAction = authActionClient
  .schema(shareLinkSchema)
  .metadata({
    name: "share-link",
  })
  .action(async ({ parsedInput: { postId, baseUrl } }) => {
    const link = await dub.links.create({
      url: `${baseUrl}/post/${postId}`,
    });

    return link?.shortLink;
  });
