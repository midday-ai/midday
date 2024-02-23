"use server";

import { getUser } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import { revalidateTag } from "next/cache";
import { action } from "./safe-action";
import { bulkUpdateTransactionsSchema } from "./schema";

export const bulkUpdateTransactionsAction = action(
  bulkUpdateTransactionsSchema,
  async (payload) => {
    const supabase = createClient();
    const user = await getUser();
    const teamId = user.data.team_id;

    const updatePromises = payload.map(async (transaction) => {
      return supabase
        .from("transactions")
        .update({
          category: transaction.category,
        })
        .eq("id", transaction.id)
        .eq("team_id", teamId);
    });

    await Promise.all(updatePromises);

    revalidateTag(`transactions_${teamId}`);
    revalidateTag(`spending_${teamId}`);
    revalidateTag(`metrics_${teamId}`);
  }
);
