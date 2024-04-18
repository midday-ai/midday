"use server";

import { getUser } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import { revalidateTag } from "next/cache";
import { action } from "./safe-action";
import { deleteTransactionSchema } from "./schema";

export const deleteTransactionsAction = action(
  deleteTransactionSchema,
  async ({ ids }) => {
    const supabase = createClient();
    const user = await getUser();
    const teamId = user.data.team_id;

    await supabase
      .from("transactions")
      .delete()
      .in("id", ids)
      .is("manual", true);

    revalidateTag(`transactions_${teamId}`);
    revalidateTag(`spending_${teamId}`);
    revalidateTag(`metrics_${teamId}`);
    revalidateTag(`current_burn_rate_${teamId}`);
    revalidateTag(`burn_rate_${teamId}`);
  }
);
