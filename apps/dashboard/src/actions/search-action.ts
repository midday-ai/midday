"use server";

import { getUser } from "@midday/supabase/cached-queries";
import { action } from "./safe-action";
import { searchSchema } from "./schema";
import { createClient } from "@midday/supabase/server";

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
        .order("created_at", { ascending: true });

      if (!Number.isNaN(Number.parseInt(searchQuery))) {
        query.like("inbox_amount_text", `%${searchQuery}%`);
      } else {
        query.textSearch("fts", `${searchQuery}:*`);
      }

      const { data } = await query.range(0, limit);

      return data;
    }

    default:
      return [];
  }
});
