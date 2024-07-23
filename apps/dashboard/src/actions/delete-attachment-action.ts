"use server";

import { LogEvents } from "@midday/events/events";
import { deleteAttachment } from "@midday/supabase/mutations";
import { revalidateTag } from "next/cache";
import { authActionClient } from "./safe-action";
import { deleteAttachmentSchema } from "./schema";

export const deleteAttachmentAction = authActionClient
  .schema(deleteAttachmentSchema)
  .metadata({
    name: "delete-attachment",
    track: {
      event: LogEvents.DeleteAttachment.name,
      channel: LogEvents.DeleteAttachment.channel,
    },
  })
  .action(async ({ parsedInput: files, ctx: { user, supabase } }) => {
    const data = await deleteAttachment(supabase, files);

    if (!data?.transaction_id) {
      return null;
    }

    revalidateTag(`transactions_${user.team_id}`);

    // Find inbox by attachment_id and delete attachment_id
    await supabase
      .from("inbox")
      .update({
        transaction_id: null,
      })
      .eq("transaction_id", data.transaction_id);

    return data;
  });
