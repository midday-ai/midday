"use server";

import { LogEvents } from "@midday/events/events";
import { remove } from "@midday/supabase/storage";
import { revalidateTag } from "next/cache";
import { authActionClient } from "./safe-action";
import { deleteFileSchema } from "./schema";

export const deleteFileAction = authActionClient
  .schema(deleteFileSchema)
  .metadata({
    event: LogEvents.DeleteFile.name,
    channel: LogEvents.DeleteFile.channel,
  })
  .action(async ({ parsedInput: { value }, ctx: { user, supabase } }) => {
    await remove(supabase, {
      bucket: "vault",
      path: [user.team_id, ...value.path],
    });

    revalidateTag(`vault_${user.team_id}`);

    return value;
  });
