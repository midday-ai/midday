/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { createClient } from "npm:@supabase/supabase-js@2.42.7";
import type { Database, Tables } from "../../src/types";

type TransactionRecord = Tables<"transaction">;
interface WebhookPayload {
  type: "UPDATE";
  table: string;
  record: TransactionRecord;
  schema: "public";
  old_record: null | TransactionRecord;
}

const supabase = createClient<Database>(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const model = new Supabase.ai.Session("gte-small");

Deno.serve(async (req) => {
  const payload: WebhookPayload = await req.json();
  const { id } = payload.record;

  const { data } = await supabase
    .from("decrypted_transactions")
    .select("name:decrypted_name, amount, date, currency, category")
    .eq("id", id);

  if (!data) {
    return new Response("No data to generate embeddings from");
  }

  const content = `Name: ${data.name}, Amount: ${data.amount}${data.currency}, Date: ${data.date}, Category: ${data.category}`;
  const embedding = await model.run(content, {
    mean_pool: true,
    normalize: true,
  });

  const { error } = await supabase
    .from("decrypted_transactions")
    .update({
      embedding: JSON.stringify(embedding),
    })
    .eq("id", id);

  if (error) {
    console.warn(error.message);
  }

  return new Response("Updated");
});
