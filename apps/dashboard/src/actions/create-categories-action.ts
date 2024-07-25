"use server";

import { LogEvents } from "@midday/events/events";
import { revalidateTag } from "next/cache";
import { authActionClient } from "./safe-action";
import { createCategoriesSchema } from "./schema";

export const createCategoriesAction = authActionClient
  .schema(createCategoriesSchema)
  .metadata({
    name: "create-categories",
    track: {
      event: LogEvents.CategoryCreate.name,
      channel: LogEvents.CategoryCreate.channel,
    },
  })
  .action(async ({ parsedInput: { categories }, ctx: { user, supabase } }) => {
    const teamId = user.team_id;

    const { data } = await supabase
      .from("transaction_categories")
      .insert(
        categories.map((category) => ({
          ...category,
          team_id: teamId,
        })),
      )
      .select("id, name, color, vat, slug");

    revalidateTag(`transaction_categories_${teamId}`);

    return data;
  });
