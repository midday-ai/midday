"use server";

import { getUser } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import { revalidateTag } from "next/cache";
import { action } from "./safe-action";
import { deleteTransactionSchema } from "./schema";

export const deleteTransactionAction = action(
  deleteTransactionSchema,
  async ({ id }) => {
    const supabase = createClient();
    const user = await getUser();
    const teamId = user.data.team_id;

    await supabase
      .from("transactions")
      .delete()
      .eq("id", id)
      .is("manual", true);

    revalidateTag(`transactions_${teamId}`);
    revalidateTag(`spending_${teamId}`);
    revalidateTag(`metrics_${teamId}`);
  }
);
