import { getTransactions, transformTransactions } from "@midday/gocardless";
import { download } from "@midday/supabase/storage";
import { NextResponse } from "next/server";

export const preferredRegion = "fra1";
export const runtime = "edge";

export async function GET(req, res) {
  const requestUrl = new URL(req.url);
  const id = requestUrl.searchParams.get("id");

  const { transactions } = await getTransactions({
    accountId: id,
  });

  const formatted = transformTransactions(transactions.booked, {
    teamId: 123,
  });

  return NextResponse.json(formatted);
}
