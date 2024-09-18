"use server";

import { updateSimilarTransactionsRecurring } from "@midday/supabase/mutations";
import { revalidateTag } from "next/cache";
import { authActionClient } from "./safe-action";
import { updateSimilarTransactionsRecurringSchema } from "./schema";

export const updateSimilarTransactionsRecurringAction = authActionClient
  .schema(updateSimilarTransactionsRecurringSchema)
  .metadata({
    name: "update-similar-transactions-recurring",
  })
  .action(async ({ parsedInput: { id }, ctx: { user, supabase } }) => {
    await updateSimilarTransactionsRecurring(supabase, {
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
