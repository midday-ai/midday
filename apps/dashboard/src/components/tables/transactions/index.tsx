import { Pagination } from "@/components/pagination";
import { DataTable } from "@/components/tables/transactions/table";
import { getTransactions } from "@midday/supabase/queries";
import { getSupabaseServerClient } from "@midday/supabase/server-client";
import { columns } from "./columns";

const size = 30;

export async function Table({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const page = typeof searchParams.page === "string" ? +searchParams.page : 1;

  const { date, search } =
    (searchParams?.filter && JSON.parse(searchParams.filter)) ?? {};

  const to = page * size;
  const supabase = await getSupabaseServerClient();
  const { data } = await getTransactions(supabase, {
    to,
    date,
    search,
  });

  const totalCount = data.length;

  return (
    <div className="space-y-4">
      <DataTable columns={columns} data={data} />
      <div>{totalCount > to && <Pagination page={page} />}</div>
    </div>
  );
}
