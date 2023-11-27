import { getTransactions } from "@midday/gocardless";
import { transformTransactions } from "@midday/jobs/src/utils";
import { createClient } from "@midday/supabase/server";
import { NextResponse } from "next/server";

export const preferredRegion = "fra1";
export const runtime = "edge";

export async function GET(req, res) {
  const supabase = createClient();

  const { data } = await supabase
    .from("bank_accounts")
    .select("id,team_id,account_id")
    .eq("id", "ded116f2-050b-431e-89bf-dcf34635b304")
    .single();

  const { transactions } = await getTransactions(data?.account_id);

  // We want to insert transactions in reversed order so the incremental id in the databae is correct
  const combinedTransactions = [
    ...transactions.pending.map((transaction) => ({
      ...transaction,
      pending: true,
    })),
    ...transactions.booked,
  ].reverse();

  const transformedTransactions = transformTransactions(combinedTransactions, {
    accountId: data?.id,
    teamId: data?.team_id,
  });

  const { data: transactionsData, error } = await supabase
    .from("transactions")
    .upsert(transformedTransactions, {
      onConflict: "internal_id",
      ignoreDuplicates: true,
    })
    .select();

  console.log(error);

  return NextResponse.json({ ok: true });
}
