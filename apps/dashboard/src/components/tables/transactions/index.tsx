import { Pagination } from "@/components/pagination";
import { DataTable } from "@/components/tables/transactions/data-table";
import {
  getCachedCurrentUser,
  getCachedTransactions,
} from "@midday/supabase/cached-queries";
import {
  getPagination,
  getTeamBankAccounts,
  getTransactions,
} from "@midday/supabase/queries";
import { createClient } from "@midday/supabase/server";
import { BottomBar } from "./bottom-bar";
import { NoAccountConnected, NoResults } from "./empty-states";

const pageSize = 50;

export async function Table({ filter, page, sort }) {
  const hasFilters = Object.keys(filter).length > 0;
  const { to, from } = getPagination(page, pageSize);
  const supabase = await createClient();
  const { data: userData } = await getCachedCurrentUser();
  const { data, meta } = await getCachedTransactions({
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
