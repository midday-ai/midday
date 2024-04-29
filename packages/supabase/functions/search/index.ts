/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { createClient } from "npm:@supabase/supabase-js@2.42.7";
import type { Database } from "../../types";

const supabase = createClient<Database>(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const model = new Supabase.ai.Session("gte-small");

Deno.serve(async (req) => {
  // Use zod
  const {
    search,
    type,
    team_id,
    limit = 10,
    threshold = 0.75,
  } = await req.json();

  if (!search || !team_id || !type) {
    return new Response("Please provide missing param");
  }

  const embedding = await model.run(search, {
    mean_pool: true,
    normalize: true,
  });

  try {
    switch (type) {
      case "inbox": {
        const { data: result } = await supabase
          .rpc("query_inbox_embeddings", {
            embedding: JSON.stringify(embedding),
            match_threshold: threshold,
            team_id,
          })
          .select("*")
          .limit(limit);

        const data = result.map(({ transaction_id, ...rest }) => ({
          ...rest,
          transaction: transaction_id
            ? {
                id: transaction_id,
                date: rest.transaction_date,
                name: rest.transaction_name,
                amount: rest.transaction_amount,
                currency: rest.transaction_currency,
              }
            : null,
        }));

        return Response.json({ data });
      }
      default:
        break;
    }
  } catch (error) {
    return Response.json(error);
  }
});
