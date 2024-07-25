"use server";

import { updateSimilarTransactions } from "@midday/supabase/mutations";
import { revalidateTag } from "next/cache";
import { authActionClient } from "./safe-action";
import { updateSimilarTransactionsSchema } from "./schema";

export const updateSimilarTransactionsAction = authActionClient
  .schema(updateSimilarTransactionsSchema)
  .metadata({
    name: "update-similar-transactions",
  })
  .action(async ({ parsedInput: { id }, ctx: { user, supabase } }) => {
    await updateSimilarTransactions(supabase, {
      team_id: user.team_id,
      id,
    });

    revalidateTag(`transactions_${user.team_id}`);
    revalidateTag(`spending_${user.team_id}`);
    revalidateTag(`metrics_${user.team_id}`);
    revalidateTag(`current_burn_rate_${user.team_id}`);
    revalidateTag(`burn_rate_${user.team_id}`);
  });
