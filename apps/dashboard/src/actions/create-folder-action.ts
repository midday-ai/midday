"use server";

import { getUser } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import { createFolder } from "@midday/supabase/storage";
import { revalidateTag } from "next/cache";
import { action } from "./safe-action";
import { createFolderSchema } from "./schema";

export const createFolderAction = action(createFolderSchema, async (value) => {
  const supabase = createClient();
  const user = await getUser();

  const { error } = await createFolder(supabase, {
    bucket: "vault",
    path: `${user.data.team_id}/${value.path}`,
    name: value.name,
  });

  console.log(error);

  await revalidateTag(`vault_${user.data.team_id}`);

  return error;
});
