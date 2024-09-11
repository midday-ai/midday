"use server";

import { authActionClient } from "./safe-action";
import { searchSchema } from "./schema";

export const searchAction = authActionClient
  .schema(searchSchema)
  .metadata({
    name: "search",
  })
  .action(async ({ parsedInput: params, ctx: { supabase } }) => {
    const { query, limit = 10 } = params;

    const { data: documents } = await supabase
      .from("inbox")
      .select("*")
      .textSearch("fts", `'${query}':*`)
      .limit(limit);

    return documents;
  });
