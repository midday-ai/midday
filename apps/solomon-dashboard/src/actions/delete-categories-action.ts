"use server";

import { LogEvents } from "@midday/events/events";
import { setupAnalytics } from "@midday/events/server";
import { getUser } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import {
  revalidatePath as revalidatePathFunc,
  revalidateTag,
} from "next/cache";
import { action } from "./safe-action";
import { deleteCategoriesSchema } from "./schema";

export const deleteCategoriesAction = action(
  deleteCategoriesSchema,
  async ({ ids, revalidatePath }) => {
    const supabase = createClient();
    const user = await getUser();

    const teamId = user?.data?.team_id;

    const response = await supabase
      .from("transaction_categories")
      .delete()
      .in("id", ids)
      .eq("system", false)
      .select();

    revalidatePathFunc(revalidatePath);
    revalidateTag(`transactions_${teamId}`);
    revalidateTag(`spending_${teamId}`);

    const analytics = await setupAnalytics({
      userId: user.data.id,
      fullName: user.data.full_name,
    });

    analytics.track({
      event: LogEvents.CategoryDelete.name,
      channel: LogEvents.CategoryDelete.channel,
    });

    return response;
  }
);
