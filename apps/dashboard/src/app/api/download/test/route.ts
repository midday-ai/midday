import { createClient } from "@midday/supabase/server";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export const preferredRegion = "fra1";
export const runtime = "edge";

export async function processPromisesBatch(
  items: Array<any>,
  limit: number,
  fn: (item: any) => Promise<any>
): Promise<any> {
  let results = [];
  for (let start = 0; start < items.length; start += limit) {
    const end = start + limit > items.length ? items.length : start + limit;

    const slicedResults = await Promise.all(items.slice(start, end).map(fn));

    results = [...results, ...slicedResults];
  }

  return results;
}

export async function GET(req, res) {
  const supabase = createClient();
  const teamId = "182bdc06-ca41-47c5-bd1e-14700451ee14";

  const { data: transactionsData } = await supabase
    .from("transactions")
    .select("id, name")
    .eq("team_id", teamId)
    .is("category", null)
    .is("logo_url", null)
    .is("enrichment_id", null)
    .select();

  async function enrichTransactions(transaction) {
    const { data } = await supabase
      .rpc("search_enriched_transactions", { term: transaction.name })
      .single();

    if (data) {
      return {
        ...transaction,
        enrichment_id: data?.id ?? null,
      };
    }
  }

  const result = await processPromisesBatch(
    transactionsData,
    5,
    enrichTransactions
  );

  const filteredItems = result.filter(Boolean);

  if (filteredItems.length > 0) {
    const { data: updatedTransactions } = await supabase
      .from("transactions")
      .upsert(filteredItems)
      .select();

    if (updatedTransactions?.length > 0) {
      revalidateTag(`transactions_${teamId}`);
      revalidateTag(`spending_${teamId}`);
      revalidateTag(`metrics_${teamId}`);
    }
  }

  return NextResponse.json(filteredItems);
}
