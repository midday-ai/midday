"use server";

import { LogEvents } from "@midday/events/events";
import { remove } from "@midday/supabase/storage";
import { revalidatePath } from "next/cache";
import { authActionClient } from "./safe-action";
import { deleteFileSchema } from "./schema";

export const deleteFileAction = authActionClient
  .schema(deleteFileSchema)
  .metadata({
    name: "delete-file",
    track: {
      event: LogEvents.DeleteFile.name,
      channel: LogEvents.DeleteFile.channel,
    },
  })
  .action(async ({ parsedInput: { path, id }, ctx: { user, supabase } }) => {
    await remove(supabase, {
      bucket: "vault",
      path: [user.team_id, ...path],
    });

    revalidatePath("/vault");

    return id;
  });
