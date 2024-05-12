"use server";

import { getUser } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import { revalidateTag } from "next/cache";
import { action } from "./safe-action";
import { updateCategorySchema } from "./schema";

export const updateCategoryAction = action(
  updateCategorySchema,
  async ({ id, name, color, description, vat }) => {
    const supabase = createClient();
    const user = await getUser();
    const teamId = user?.data.team_id;

    await supabase
      .from("transaction_categories")
      .update({ name, color, description, vat })
      .eq("id", id);

    revalidateTag(`transaction_categories_${teamId}`);
    revalidateTag(`transactions_${teamId}`);
    revalidateTag(`spending_${teamId}`);
  }
);
