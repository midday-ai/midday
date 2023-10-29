"use server";

import { deleteBankAccount } from "@midday/supabase/mutations";
import { createClient } from "@midday/supabase/server";
import { revalidatePath } from "next/cache";
import { action } from "./safe-action";
import { deleteBankAccountSchema } from "./schema";

export const deleteBankAccountAction = action(
  deleteBankAccountSchema,
  async ({ path, id }) => {
    const supabase = createClient();
    await deleteBankAccount(supabase, id);

    revalidatePath(path);
  },
);
