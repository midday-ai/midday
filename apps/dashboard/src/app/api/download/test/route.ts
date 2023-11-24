import { enrichTransactions } from "@midday/plaid";
import { createClient } from "@midday/supabase/server";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export const preferredRegion = "fra1";
export const runtime = "edge";

export async function GET(req, res) {
  const supabase = createClient();
  const requestUrl = new URL(req.url);
  const query = requestUrl.searchParams.get("query");

  const { data, error } = await supabase
    .rpc("search_enriched_transactions", { term: query })
    .single();

  console.log(error);

  return NextResponse.json(data);
}
