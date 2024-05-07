"use server";

import { getUser } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import { action } from "./safe-action";
import { createCategoriesSchema } from "./schema";
import { revalidatePath as revalidatePathFunc } from "next/cache";

export const createCategoriesAction = action(
  createCategoriesSchema,
  async ({ categories, revalidatePath }) => {
    const supabase = createClient();
    const user = await getUser();

    const response = await supabase.from("transaction_categories").insert(
      categories.map((category) => ({
        ...category,
        team_id: user?.data?.team_id,
      }))
    );

    console.log(response);

    revalidatePathFunc(revalidatePath);

    return response;
  }
);
