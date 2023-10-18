import { Pagination } from "@/components/pagination";
import { DataTable } from "@/components/tables/transactions/data-table";
import { getPagination, getTransactions } from "@midday/supabase/queries";
import { getSupabaseServerClient } from "@midday/supabase/server-client";

const pageSize = 50;

export async function Table({ filter, page }) {
  const supabase = await getSupabaseServerClient();
  const { data } = await getTransactions(supabase, {
    ...getPagination(page, pageSize),
    filter,
  });

  return (
    <>
      <DataTable data={data} />
      <Pagination
        basePath="/transactions"
        page={page}
        hasNextPage={data.length === pageSize}
        className="mt-4"
      />
    </>
  );
}
