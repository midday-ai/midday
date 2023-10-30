"use server";

import { deleteBankAccount } from "@midday/supabase/mutations";
import { createClient } from "@midday/supabase/server";
import { revalidatePath as revalidatePathFunc } from "next/cache";
import { action } from "./safe-action";
import { deleteBankAccountSchema } from "./schema";

export const deleteBankAccountAction = action(
  deleteBankAccountSchema,
  async ({ revalidatePath, id }) => {
    const supabase = createClient();
    await deleteBankAccount(supabase, id);

    revalidatePathFunc(revalidatePath);
  },
);
