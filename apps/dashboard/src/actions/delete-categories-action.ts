"use server";

import { LogEvents } from "@midday/events/events";
import {
  revalidatePath as revalidatePathFunc,
  revalidateTag,
} from "next/cache";
import { authActionClient } from "./safe-action";
import { deleteCategoriesSchema } from "./schema";

export const deleteCategoriesAction = authActionClient
  .schema(deleteCategoriesSchema)
  .metadata({
    name: "delete-categories",
    track: {
      event: LogEvents.CategoryDelete.name,
      channel: LogEvents.CategoryDelete.channel,
    },
  })
  .action(
    async ({
      parsedInput: { ids, revalidatePath },
      ctx: { user, supabase },
    }) => {
      const response = await supabase
        .from("transaction_categories")
        .delete()
        .in("id", ids)
        .eq("system", false)
        .select();

      revalidatePathFunc(revalidatePath);
      revalidateTag(`transactions_${user.team_id}`);
      revalidateTag(`spending_${user.team_id}`);

      return response;
    },
  );
