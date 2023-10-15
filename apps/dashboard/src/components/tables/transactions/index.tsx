import { DataTable } from "@/components/tables/transactions/data-table";
import { getTransactions } from "@midday/supabase/queries";
import { getSupabaseServerClient } from "@midday/supabase/server-client";
import { columns } from "./columns";

export async function TransactionsTable() {
  const supabase = await getSupabaseServerClient();
  const data = await getTransactions(supabase, { from: 0, to: 25 });

  return <DataTable columns={columns} data={data} />;
}
