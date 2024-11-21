"use server";

import { revalidateTag } from "next/cache";
import { authActionClient } from "./safe-action";
import { bulkUpdateTransactionsSchema } from "./schema";

export const bulkUpdateTransactionsAction = authActionClient
  .schema(bulkUpdateTransactionsSchema)
  .metadata({
    name: "bulk-update-transactions",
  })
  .action(
    async ({ parsedInput: { type, ...payload }, ctx: { user, supabase } }) => {
      if (type === "tags") {
        const data = await supabase
          .from("transaction_tags")
          .insert(
            payload.data.map(({ id, ...params }) => ({
              transaction_id: id,
              tag_id: params.tag_id,
              team_id: user.team_id!,
            })),
          )
          .select();

        revalidateTag(`transactions_${user.team_id}`);

        return data;
      }

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
      revalidateTag(`expenses_${user.team_id}`);

      return data;
    },
  );
