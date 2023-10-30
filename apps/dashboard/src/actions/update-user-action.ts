"use server";

import { updateUser } from "@midday/supabase/mutations";
import { createClient } from "@midday/supabase/server";
import { revalidatePath as revalidatePathFunc } from "next/cache";
import { action } from "./safe-action";
import { updateUserSchema } from "./schema";

export const updateUserAction = action(
  updateUserSchema,
  async ({ revalidatePath, ...data }) => {
    const supabase = createClient();
    const user = await updateUser(supabase, data);

    if (revalidatePath) {
      revalidatePathFunc(revalidatePath);
    }

    return user;
  },
);
