"use server";

import { updateSimilarTransactionsCategory } from "@midday/supabase/mutations";
import { revalidateTag } from "next/cache";
import { authActionClient } from "./safe-action";
import { updateSimilarTransactionsCategorySchema } from "./schema";

export const updateSimilarTransactionsCategoryAction = authActionClient
  .schema(updateSimilarTransactionsCategorySchema)
  .metadata({
    name: "update-similar-transactions-category",
  })
  .action(async ({ parsedInput: { id }, ctx: { user, supabase } }) => {
    await updateSimilarTransactionsCategory(supabase, {
      team_id: user.team_id,
      id,
    });

    revalidateTag(`transactions_${user.team_id}`);
    revalidateTag(`spending_${user.team_id}`);
    revalidateTag(`metrics_${user.team_id}`);
    revalidateTag(`current_burn_rate_${user.team_id}`);
    revalidateTag(`burn_rate_${user.team_id}`);
    revalidateTag(`expenses_${user.team_id}`);
  });
