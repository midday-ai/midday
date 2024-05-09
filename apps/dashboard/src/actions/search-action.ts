"use server";

import { getUser } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import { action } from "./safe-action";
import { searchSchema } from "./schema";

export const searchAction = action(searchSchema, async (params) => {
  const user = await getUser();
  const supabase = createClient();
  const teamId = user?.data?.team_id;

  const { query: searchQuery, type, limit = 10 } = params;

  switch (type) {
    case "inbox": {
      const query = supabase
        .from("inbox")
        .select(
          "id, file_name, amount, currency, file_path, content_type, due_date, display_name"
        )
        .eq("team_id", teamId)
        .neq("status", "deleted")
        .order("created_at", { ascending: true });

      if (!Number.isNaN(Number.parseInt(searchQuery))) {
        query.like("inbox_amount_text", `%${searchQuery}%`);
      } else {
        query.textSearch("fts", `${searchQuery}:*`);
      }

      const { data } = await query.range(0, limit);

      return data;
    }

    case "categories": {
      const query = supabase
        .from("transaction_categories")
        .select("id, name, color")
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
