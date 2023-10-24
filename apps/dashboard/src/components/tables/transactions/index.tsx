import { Pagination } from "@/components/pagination";
import { DataTable } from "@/components/tables/transactions/data-table";
import {
  getPagination,
  getTeamBankAccounts,
  getTransactions,
  getUserDetails,
} from "@midday/supabase/queries";
import { getSupabaseServerClient } from "@midday/supabase/server-client";
import { BottomBar } from "./bottom-bar";
import { NoAccountConnected, NoResults } from "./empty-states";

const pageSize = 50;

export async function Table({ filter, page, sort }) {
  const hasFilters = Object.keys(filter).length > 0;
  const { to, from } = getPagination(page, pageSize);
  const supabase = await getSupabaseServerClient();
  const { data: userData } = await getUserDetails(supabase);
  const { data, meta } = await getTransactions(supabase, {
    to,
    from,
    filter,
    sort,
  });

  if (!data?.length) {
    const { data: bankAccounts } = await getTeamBankAccounts(supabase);

    if (!bankAccounts?.length) {
      return <NoAccountConnected />;
    }

    return <NoResults hasFilters={hasFilters} />;
  }

  const hasNextPage = meta.count + 1 * page > pageSize;

  return (
    <>
      <DataTable data={data} teamId={userData?.team_id} />
      {hasFilters ? (
        <div className="h-10" />
      ) : (
        <Pagination
          page={page}
          count={meta.count}
          to={to}
          from={from}
          hasNextPage={hasNextPage}
          className="mt-4"
        />
      )}
      {meta.count > 0 && (
        <BottomBar
          show={hasFilters}
          page={page}
          count={meta.count}
          hasNextPage={hasNextPage}
          to={to}
          from={from}
          totalAmount={meta.totalAmount}
          currency={meta.currency}
        />
      )}
    </>
  );
}
