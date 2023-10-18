import {
  DataTable,
  DataTableRow,
} from "@/components/tables/transactions/data-table";
import { getSupabaseServerActionClient } from "@midday/supabase/action-client";
import { getPagination, getTransactions } from "@midday/supabase/queries";
import { getSupabaseServerClient } from "@midday/supabase/server-client";

const pageSize = 30;

export async function Table({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const filter =
    (searchParams?.filter && JSON.parse(searchParams.filter)) ?? {};

  async function fetchMore(page: number) {
    "use server";

    const supabase = await getSupabaseServerActionClient();
    const { data } = await getTransactions(supabase, {
      ...getPagination(page, pageSize),
      filter,
    });

    return data;
  }

  const supabase = await getSupabaseServerClient();
  const { data } = await getTransactions(supabase, {
    ...getPagination(0, pageSize),
    filter,
  });

  return <DataTable data={data} fetchMore={fetchMore} />;
}
