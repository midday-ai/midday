"use server";

import { LogEvents } from "@midday/events/events";
import { deleteFolder } from "@midday/supabase/storage";
import { revalidateTag } from "next/cache";
import { authActionClient } from "./safe-action";
import { deleteFolderSchema } from "./schema";

export const deleteFolderAction = authActionClient
  .schema(deleteFolderSchema)
  .metadata({
    event: LogEvents.DeleteFolder.name,
    channel: LogEvents.DeleteFolder.channel,
  })
  .action(async ({ parsedInput: { value }, ctx: { user, supabase } }) => {
    await deleteFolder(supabase, {
      bucket: "vault",
      path: [user.team_id, ...value.path],
    });

    revalidateTag(`vault_${user.team_id}`);

    return value;
  });
