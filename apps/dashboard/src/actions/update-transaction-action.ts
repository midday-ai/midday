"use server";

import { updateTransaction } from "@midday/supabase/mutations";
import { revalidateTag } from "next/cache";
import { authActionClient } from "./safe-action";
import { updateTransactionSchema } from "./schema";

export const updateTransactionAction = authActionClient
  .schema(updateTransactionSchema)
  .metadata({
    name: "update-transaction",
  })
  .action(
    async ({ parsedInput: { id, ...payload }, ctx: { user, supabase } }) => {
      const { data } = await updateTransaction(supabase, id, payload);

      revalidateTag(`transactions_${user.team_id}`);
      revalidateTag(`spending_${user.team_id}`);
      revalidateTag(`metrics_${user.team_id}`);
      revalidateTag(`current_burn_rate_${user.team_id}`);
      revalidateTag(`burn_rate_${user.team_id}`);
      revalidateTag(`expenses_${user.team_id}`);

      return data;
    },
  );
