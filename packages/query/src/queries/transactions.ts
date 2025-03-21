import type { GetTransactionsParams } from "@midday/supabase/queries";
import type { Client } from "@midday/supabase/types";

export async function getTransactions(
  supabase: Client,
  params: GetTransactionsParams,
) {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .range(params.from, params.to);

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
