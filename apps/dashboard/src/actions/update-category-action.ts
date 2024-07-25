"use server";

import { revalidateTag } from "next/cache";
import { authActionClient } from "./safe-action";
import { updateCategorySchema } from "./schema";

export const updateCategoryAction = authActionClient
  .schema(updateCategorySchema)
  .metadata({
    name: "update-category",
  })
  .action(
    async ({
      parsedInput: { id, name, color, description, vat },
      ctx: { user, supabase },
    }) => {
      await supabase
        .from("transaction_categories")
        .update({ name, color, description, vat })
        .eq("id", id);

      revalidateTag(`transaction_categories_${user.team_id}`);
      revalidateTag(`transactions_${user.team_id}`);
      revalidateTag(`spending_${user.team_id}`);
    },
  );
