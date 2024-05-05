import { DataTable } from "@/components/tables/transactions/data-table";
import { getTransactions } from "@midday/supabase/cached-queries";
import { cookies } from "next/headers";
import { columns } from "./columns";
import { NoResults } from "./empty-states";
import { Loading } from "./loading";
import { Cookies } from "@/utils/constants";

const pageSize = 50;
const maxItems = 100000;

type Props = {
  filter: any;
  page: number;
  sort: any;
  noAccounts: boolean;
  query?: string;
};

export async function Table({ filter, page, sort, noAccounts, query }: Props) {
  const hasFilters = Object.keys(filter).length > 0;
  const initialColumnVisibility = JSON.parse(
    cookies().get(Cookies.TransactionsColumns)?.value || "[]"
  );

  // NOTE: When we have a filter we want to show all results so users can select
  // And handle all in once (export etc)
  const { data, meta } = await getTransactions({
    to: hasFilters ? maxItems : pageSize,
    from: 0,
    filter,
    sort,
    searchQuery: query,
  });

  async function loadMore({ from, to }) {
    "use server";

    return getTransactions({
      to,
      from: from + 1,
      filter,
      sort,
      searchQuery: query,
    });
  }

  if (!data?.length) {
    if (noAccounts) {
      return <Loading />;
    }

    if (query?.length) {
      return <NoResults hasFilters />;
    }

    return <NoResults hasFilters={hasFilters} />;
  }

  const hasNextPage = meta.count / (page + 1) > pageSize;

  return (
    <DataTable
      initialColumnVisibility={initialColumnVisibility}
      columns={columns}
      data={data}
      pageSize={pageSize}
      loadMore={loadMore}
      hasNextPage={hasNextPage}
      meta={meta}
      hasFilters={hasFilters}
      page={page}
      query={query}
    />
  );
}
