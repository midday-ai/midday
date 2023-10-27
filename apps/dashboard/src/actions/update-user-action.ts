"use server";

import { updateUser } from "@midday/supabase/mutations";
import { createClient } from "@midday/supabase/server";
import { revalidatePath } from "next/cache";
import { action } from "./safe-action";
import { updateUserSchema } from "./schema";

export const updateUserAction = action(
  updateUserSchema,
  async ({ path, ...data }) => {
    const supabase = createClient();
    const user = await updateUser(supabase, data);

    revalidatePath(path);

    return user;
  },
);
