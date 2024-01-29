"use server";

import { getUser } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import { deleteFolder } from "@midday/supabase/storage";
import { revalidatePath as revalidatePathFunc } from "next/cache";
import { action } from "./safe-action";
import { deleteInviteSchema } from "./schema";

export const deleteInviteAction = action(
  deleteInviteSchema,
  async ({ id, revalidatePath }) => {
    const supabase = createClient();
    const user = await getUser();

    await supabase.from("user_invites").delete().eq("id", id);

    if (revalidatePath) {
      revalidatePathFunc(revalidatePath);
    }

    return id;
  }
);
