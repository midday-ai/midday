import { getTransactions, transformTransactions } from "@midday/gocardless";
import { createClient } from "@midday/supabase/server";
import { NextResponse } from "next/server";

export const preferredRegion = "fra1";
export const runtime = "nodejs";

export async function GET(req, res) {
  const supabase = createClient();

  const teamId = "dd6a039e-d071-423a-9a4d-9ba71325d890";
  const accountId = "3332a1e0-c466-47a8-af08-e8d401981982";

  const { transactions } = await getTransactions({
    accountId,
  });

  const formattedTransactions = [
    {
      date: "2022-06-03",
      name: "Paypal Goog",
      method: "card_purchase",
      internal_id:
        "dd6a039e-d071-423a-9a4d-9ba71325d890_c5d29d47ea860429e934c48ab11711c9",
      amount: "-56.90",
      currency: "SEK",
      bank_account_id: "92a8697a-6ac0-4920-a85a-8195e9a93f11",
      category: null,
      team_id: "dd6a039e-d071-423a-9a4d-9ba71325d890",
      currency_rate: undefined,
      currency_source: undefined,
      balance: undefined,
      status: "posted",
    },
  ];

  //   const formattedTransactions = transformTransactions(transactions?.booked, {
  //     teamId,
  //     accountId: "92a8697a-6ac0-4920-a85a-8195e9a93f11",
  //   });

  //   console.log(formattedTransactions);

  const { data: transactionsData, error } = await supabase
    .from("decrypted_transactions")
    .upsert(formattedTransactions, {
      onConflict: "internal_id",
      ignoreDuplicates: true,
    })
    .select("*, name:decrypted_name");

  console.log(transactionsData, error);

  return NextResponse.json({ ok: true });
}
