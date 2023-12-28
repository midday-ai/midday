"use server";

import { getUser } from "@midday/supabase/cached-queries";
import { updateSimilarTransactions } from "@midday/supabase/mutations";
import { createClient } from "@midday/supabase/server";
import { revalidateTag } from "next/cache";
import { action } from "./safe-action";
import { updateSimilarTransactionsSchema } from "./schema";

export const updateSimilarTransactionsAction = action(
  updateSimilarTransactionsSchema,
  async ({ id }) => {
    const supabase = createClient();
    const user = await getUser();
    const teamId = user.data.team_id;

    await updateSimilarTransactions(supabase, id);

    revalidateTag(`transactions_${teamId}`);
    revalidateTag(`spending_${teamId}`);
    revalidateTag(`metrics_${teamId}`);
  }
);
