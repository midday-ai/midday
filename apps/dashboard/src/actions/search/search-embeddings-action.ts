"use server";

import { getUser } from "@midday/supabase/cached-queries";
import { action } from "../safe-action";
import { searchEmbeddingsSchema } from "../schema";

export const searchEmbeddingsAction = action(
  searchEmbeddingsSchema,
  async (params) => {
    const user = await getUser();

    const { query, type, limit = 10, threshold } = params;

    console.log({ query, type });

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/search`,
      {
        cache: "no-store",
        method: "POST",
        headers: {
          authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          type,
          limit,
          threshold,
          search: query,
          team_id: user?.data?.team_id,
        }),
      }
    );

    const { data } = await res.json();

    console.log(data);

    return data;
  }
);
