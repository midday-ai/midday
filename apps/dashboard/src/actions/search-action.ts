"use server";

import { getUser } from "@midday/supabase/cached-queries";
import { getInboxSearchQuery } from "@midday/supabase/queries";
import { createClient } from "@midday/supabase/server";
import { addDays, isWithinInterval } from "date-fns";
import { action } from "./safe-action";
import { searchSchema } from "./schema";

export const searchAction = action(searchSchema, async (params) => {
  const user = await getUser();
  const supabase = createClient();
  const teamId = user?.data?.team_id;

  const { query: searchQuery, type, limit = 10 } = params;

  switch (type) {
    case "inbox": {
      const data = await getInboxSearchQuery(supabase, {
        teamId,
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
        .eq("team_id", teamId)
        .ilike("name", `%${searchQuery}%`)
        .order("created_at", { ascending: true });

      const { data } = await query.range(0, limit);

      return data;
    }

    default:
      return [];
  }
});
