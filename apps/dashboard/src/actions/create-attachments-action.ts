"use server";

import { LogEvents } from "@midday/events/events";
import { createAttachments } from "@midday/supabase/mutations";
import { createClient } from "@midday/supabase/server";
import { revalidateTag } from "next/cache";
import { authActionClient } from "./safe-action";
import { createAttachmentsSchema } from "./schema";

export const createAttachmentsAction = authActionClient
  .schema(createAttachmentsSchema)
  .metadata({
    event: LogEvents.CreateAttachment.name,
    channel: LogEvents.CreateAttachment.channel,
  })
  .action(async ({ parsedInput: files, ctx: { user } }) => {
    const supabase = createClient();
    const data = await createAttachments(supabase, files);

    revalidateTag(`transactions_${user.team_id}`);

    return data;
  });
