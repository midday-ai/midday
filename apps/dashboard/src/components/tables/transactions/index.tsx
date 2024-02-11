import { DataTable } from "@/components/tables/transactions/data-table";
import { getTransactions, getUser } from "@midday/supabase/cached-queries";
import { columns } from "./columns";
import { NoResults } from "./empty-states";
import { Loading } from "./loading";

const pageSize = 50;
const maxItems = 100000;

export async function Table({
  filter,
  page,
  sort,
  noAccounts,
  initialTransactionId,
  query,
}) {
  const hasFilters = Object.keys(filter).length > 0;
  const { data: userData } = await getUser();

  // NOTE: When we have a filter we want to show all results so users can select
  // And handle all in once (export etc)
  const { data, meta } = await getTransactions({
    to: hasFilters ? maxItems : pageSize,
    from: 0,
    filter,
    sort,
    search: {
      query,
      fuzzy: true,
    },
  });

  async function loadMore({ from, to }) {
    "use server";

    return getTransactions({
      to,
      from,
      filter,
      sort,
      search: {
        query,
        fuzzy: true,
      },
    });
  }

  if (!data?.length) {
    if (noAccounts) {
      return <Loading />;
    }

    if (query.length) {
      return <NoResults hasFilters />;
    }

    return <NoResults hasFilters={hasFilters} />;
  }

  const hasNextPage = meta.count / (page + 1) > pageSize;

  return (
    <DataTable
      teamId={userData.team_id}
      initialTransactionId={initialTransactionId}
      columns={columns}
      data={data}
      pageSize={pageSize}
      loadMore={loadMore}
      hasNextPage={hasNextPage}
      meta={meta}
      hasFilters={hasFilters}
      page={page}
    />
  );
}
