"use server";

import { getUser } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import { deleteFolder, remove } from "@midday/supabase/storage";
import { revalidateTag } from "next/cache";
import { action } from "./safe-action";
import { deleteFileSchema } from "./schema";

export const deleteFileAction = action(deleteFileSchema, async (value) => {
  const supabase = createClient();
  const user = await getUser();

  if (value.isFolder) {
    await deleteFolder(supabase, {
      bucket: "vault",
      path: `${user.data.team_id}/${value.path}`,
    });
  }

  await remove(supabase, {
    bucket: "vault",
    path: `${user.data.team_id}/${value.path}`,
  });

  await revalidateTag(`vault_${user.data.team_id}`);

  return value;
});
