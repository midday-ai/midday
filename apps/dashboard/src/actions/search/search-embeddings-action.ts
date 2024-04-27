"use server";

import { action } from "../safe-action";
import { searchEmbeddingsSchema } from "../schema";

export const searchEmbeddingsAction = action(
  searchEmbeddingsSchema,
  async (params) => {
    const { query, type, limit = 10, threshold } = params;

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
        }),
      }
    );

    const data = await res.json();

    return data?.result;
  }
);
