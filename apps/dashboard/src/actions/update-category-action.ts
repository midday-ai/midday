"use server";

import { getUser } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import {
  revalidatePath as revalidatePathFunc,
  revalidateTag,
} from "next/cache";
import { action } from "./safe-action";
import { updateCategorySchema } from "./schema";

export const updateCategoryAction = action(
  updateCategorySchema,
  async ({ id, name, color, revalidatePath }) => {
    const supabase = createClient();
    const user = await getUser();
    const teamId = user?.data.team_id;

    await supabase
      .from("transaction_categories")
      .update({ name, color })
      .eq("id", id);

    revalidatePathFunc(revalidatePath);
    revalidateTag(`transactions_${teamId}`);
    revalidateTag(`spending_${teamId}`);
  }
);
