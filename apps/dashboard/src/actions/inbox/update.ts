"use server";

import { action } from "@/actions/safe-action";
import { updateInboxSchema } from "@/actions/schema";
import { updateInboxById } from "@midday/supabase/mutations";
import { createClient } from "@midday/supabase/server";
import { revalidateTag } from "next/cache";

export const updateInboxAction = action(updateInboxSchema, async (params) => {
  const supabase = createClient();

  const { data: inboxData } = await updateInboxById(supabase, params);

  let data = inboxData;

  if (params.transaction_id) {
    const { data: attachmentData } = await supabase
      .from("transaction_attachments")
      .insert({
        type: inboxData.content_type,
        path: inboxData.file_path,
        transaction_id: params.transaction_id,
        team_id: inboxData.team_id,
        size: inboxData.size,
        name: inboxData.file_name,
      })
      .select()
      .single();

    const { data: updatedData } = await updateInboxById(supabase, {
      id: params.id,
      attachment_id: attachmentData.id,
    });

    revalidateTag(`transactions_${inboxData.team_id}`);

    data = updatedData;
  } else {
    const { data: deletedData } = await supabase
      .from("transaction_attachments")
      .delete()
      .eq("id", inboxData.attachment_id);

    revalidateTag(`transactions_${inboxData.team_id}`);

    data = deletedData;
  }

  revalidateTag(`inbox_${inboxData.team_id}`);

  return data;
});
