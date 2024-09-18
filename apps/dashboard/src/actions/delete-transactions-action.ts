"use server";

import { revalidateTag } from "next/cache";
import { authActionClient } from "./safe-action";
import { deleteTransactionSchema } from "./schema";

export const deleteTransactionsAction = authActionClient
  .schema(deleteTransactionSchema)
  .metadata({
    name: "delete-transactions",
  })
  .action(async ({ parsedInput: { ids }, ctx: { user, supabase } }) => {
    await supabase
      .from("transactions")
      .delete()
      .in("id", ids)
      .is("manual", true);

    revalidateTag(`transactions_${user.team_id}`);
    revalidateTag(`spending_${user.team_id}`);
    revalidateTag(`metrics_${user.team_id}`);
    revalidateTag(`current_burn_rate_${user.team_id}`);
    revalidateTag(`burn_rate_${user.team_id}`);
    revalidateTag(`expenses_${user.team_id}`);
  });
