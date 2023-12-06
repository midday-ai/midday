"use server";

import { getUser } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import { deleteFolder } from "@midday/supabase/storage";
import { revalidateTag } from "next/cache";
import { action } from "./safe-action";
import { deleteFolderSchema } from "./schema";

export const deleteFolderAction = action(deleteFolderSchema, async (value) => {
  const supabase = createClient();
  const user = await getUser();

  await deleteFolder(supabase, {
    bucket: "vault",
    path: [user.data.team_id, ...value.path],
  });

  await revalidateTag(`vault_${user.data.team_id}`);

  return value;
});
