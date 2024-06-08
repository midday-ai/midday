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
    const teamId = user?.data?.team_id;

    const updatePromises = payload.data.map(async ({ id, ...params }) => {
      return supabase
        .from("transactions")
        .update(params)
        .eq("id", id)
        .eq("team_id", teamId)
        .select();
    });

    const data = await Promise.all(updatePromises);

    revalidateTag(`transactions_${teamId}`);
    revalidateTag(`spending_${teamId}`);
    revalidateTag(`metrics_${teamId}`);
    revalidateTag(`current_burn_rate_${teamId}`);
    revalidateTag(`burn_rate_${teamId}`);

    return data;
  }
);
