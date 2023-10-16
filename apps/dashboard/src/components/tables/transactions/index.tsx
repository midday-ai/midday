import { Pagination } from "@/components/pagination";
import { DataTable } from "@/components/tables/transactions/table";
import { getTransactions } from "@midday/supabase/queries";
import { getSupabaseServerClient } from "@midday/supabase/server-client";
import { columns } from "./columns";

const size = 30;

export async function TransactionsTable({ page }: { page: number }) {
  const from = (page - 1) * size;
  const supabase = await getSupabaseServerClient();
  const { data, count } = await getTransactions(supabase, {
    from: 0,
    to: from + size,
  });

  const totalPages = count / size;

  return (
    <div className="space-y-4">
      <DataTable columns={columns} data={data} />
      <div>
        <Pagination page={page} totalPages={totalPages} />
      </div>
    </div>
  );
}
