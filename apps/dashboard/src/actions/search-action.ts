"use server";

import { openai } from "@ai-sdk/openai";
import { embed } from "ai";
import { authActionClient } from "./safe-action";
import { searchSchema } from "./schema";

const embeddingModel = openai.embedding("text-embedding-3-small");

export const searchAction = authActionClient
  .schema(searchSchema)
  .metadata({
    name: "search",
  })
  .action(async ({ parsedInput: params, ctx: { supabase } }) => {
    const { query, limit = 10 } = params;

    const { embedding } = await embed({
      model: embeddingModel,
      value: query,
    });

    const { data: documents } = await supabase.rpc("hybrid_search", {
      query_text: query,
      query_embedding: embedding,
      match_count: limit,
    });

    return documents;
  });
