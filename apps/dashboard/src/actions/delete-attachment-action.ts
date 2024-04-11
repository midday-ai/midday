"use server";

import { LogEvents } from "@midday/events/events";
import { setupLogSnag } from "@midday/events/server";
import { getUser } from "@midday/supabase/cached-queries";
import { deleteAttachment } from "@midday/supabase/mutations";
import { createClient } from "@midday/supabase/server";
import { revalidateTag } from "next/cache";
import { action } from "./safe-action";
import { deleteAttachmentSchema } from "./schema";

export const deleteAttachmentAction = action(
  deleteAttachmentSchema,
  async (files) => {
    const supabase = createClient();
    const user = await getUser();
    const data = await deleteAttachment(supabase, files);

    revalidateTag(`transactions_${user.data.team_id}`);

    // Find inbox by attachment_id and delete attachment_id
    await supabase
      .from("inbox")
      .update({
        transaction_id: null,
      })
      .eq("transaction_id", data.transaction_id);

    const logsnag = setupLogSnag({
      userId: user.data.id,
      fullName: user.data.full_name,
    });

    logsnag.track({
      event: LogEvents.DeleteAttachment.name,
      icon: LogEvents.DeleteAttachment.icon,
      channel: LogEvents.DeleteAttachment.channel,
    });

    return data;
  }
);
