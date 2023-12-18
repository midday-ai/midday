import { ExportButton } from "@/components/export-button";
import { Pagination } from "@/components/pagination";
import { DataTable } from "@/components/tables/transactions/data-table";
import { getTransactions, getUser } from "@midday/supabase/cached-queries";
import { getPagination } from "@midday/supabase/queries";
import { BottomBar } from "./bottom-bar";
import { NoResults } from "./empty-states";
import { Loading } from "./loading";

const pageSize = 50;

export async function Table({
  filter,
  page,
  sort,
  noAccounts,
  initialTransactionId,
}) {
  const hasFilters = Object.keys(filter).length > 0;
  const { to, from } = getPagination(page, pageSize);
  const { data: userData } = await getUser();
  const { data, meta } = await getTransactions({
    to,
    from,
    filter,
    sort,
  });

  if (!data?.length) {
    if (noAccounts) {
      return <Loading collapsed={false} />;
    }
    return <NoResults hasFilters={hasFilters} />;
  }

  const hasNextPage = meta.count / (page + 1) > pageSize;

  return (
    <div className="relative">
      <div className="absolute right-0 -top-14">
        <ExportButton totalMissingAttachments={meta.totalMissingAttachments} />
      </div>
      <DataTable
        data={data}
        teamId={userData.team_id}
        initialTransactionId={initialTransactionId}
      />
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
    </div>
  );
}
