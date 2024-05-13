"use server";

import { getUser } from "@midday/supabase/cached-queries";
import { updateTransaction } from "@midday/supabase/mutations";
import { createClient } from "@midday/supabase/server";
import { revalidateTag } from "next/cache";
import { action } from "./safe-action";
import { updateTransactionSchema } from "./schema";

export const updateTransactionAction = action(
  updateTransactionSchema,
  async ({ id, ...payload }) => {
    const supabase = createClient();
    const user = await getUser();
    const teamId = user.data.team_id;

    const { data } = await updateTransaction(supabase, id, payload);

    revalidateTag(`transactions_${teamId}`);
    revalidateTag(`spending_${teamId}`);
    revalidateTag(`metrics_${teamId}`);
    revalidateTag(`current_burn_rate_${teamId}`);
    revalidateTag(`burn_rate_${teamId}`);

    return data;
  }
);
