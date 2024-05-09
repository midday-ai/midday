"use server";

import { getUser } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import { revalidatePath as revalidatePathFunc } from "next/cache";
import { action } from "./safe-action";
import { createCategoriesSchema } from "./schema";

export const createCategoriesAction = action(
  createCategoriesSchema,
  async ({ categories, revalidatePath }) => {
    const supabase = createClient();
    const user = await getUser();
    const teamId = user?.data?.team_id;

    const response = await supabase.from("transaction_categories").insert(
      categories.map((category) => ({
        ...category,
        team_id: teamId,
      }))
    );

    revalidatePathFunc(revalidatePath);

    return response;
  }
);
