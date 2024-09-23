import { createClient } from "@midday/supabase/client";
import { TransactionSchema } from "@midday/supabase/types";

export async function getTransactionsByBankAccountId({ bankAccountId, limit }: { bankAccountId: string; limit: number }): Promise<TransactionSchema[] | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("bank_account_id", bankAccountId)
    .order("date", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching transactions:", error);
    return null;
  }

  return data as TransactionSchema[];
}