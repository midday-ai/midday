"use server";

import { getInboxSearchQuery } from "@midday/supabase/queries";
import { addDays, isWithinInterval } from "date-fns";
import { authActionClient } from "./safe-action";
import { searchSchema } from "./schema";

export const searchAction = authActionClient
  .schema(searchSchema)
  .metadata({
    name: "search",
  })
  .action(async ({ parsedInput: params, ctx: { user, supabase } }) => {
    const { query: searchQuery, type, limit = 10 } = params;

    switch (type) {
      case "inbox": {
        const data = await getInboxSearchQuery(supabase, {
          teamId: user.team_id,
          q: searchQuery,
        });

        return data?.map((item) => {
          const pending = isWithinInterval(new Date(), {
            start: new Date(item.created_at),
            end: addDays(new Date(item.created_at), 45),
          });

          return {
            ...item,
            pending,
            review: !pending && !item.id,
          };
        });
      }

      case "categories": {
        const query = supabase
          .from("transaction_categories")
          .select("id, name, color, slug")
          .eq("team_id", user.team_id)
          .ilike("name", `%${searchQuery}%`)
          .order("created_at", { ascending: true });

        const { data } = await query.range(0, limit);

        return data;
      }

      default:
        return [];
    }
  });
