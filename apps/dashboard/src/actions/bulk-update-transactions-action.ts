"use server";

import { revalidateTag } from "next/cache";
import { authActionClient } from "./safe-action";
import { bulkUpdateTransactionsSchema } from "./schema";

export const bulkUpdateTransactionsAction = authActionClient
  .schema(bulkUpdateTransactionsSchema)
  .action(async ({ parsedInput: payload, ctx: { user, supabase } }) => {
    const updatePromises = payload.data.map(async ({ id, ...params }) => {
      return supabase
        .from("transactions")
        .update(params)
        .eq("id", id)
        .eq("team_id", user.team_id)
        .select();
    });

    const data = await Promise.all(updatePromises);

    revalidateTag(`transactions_${user.team_id}`);
    revalidateTag(`spending_${user.team_id}`);
    revalidateTag(`metrics_${user.team_id}`);
    revalidateTag(`current_burn_rate_${user.team_id}`);
    revalidateTag(`burn_rate_${user.team_id}`);

    return data;
  });
