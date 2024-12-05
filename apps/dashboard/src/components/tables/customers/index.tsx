import { getCustomers } from "@midday/supabase/cached-queries";
import { EmptyState, NoResults } from "./empty-states";
import { DataTable } from "./table";

type Props = {
  page: number;
  query?: string | null;
  sort?: string[] | null;
  start?: string | null;
  end?: string | null;
};

const pageSize = 25;

export async function CustomersTable({ query, sort, start, end, page }: Props) {
  const filter = {
    start,
    end,
  };

  async function loadMore({ from, to }: { from: number; to: number }) {
    "use server";

    return getCustomers({
      to,
      from: from + 1,
      searchQuery: query,
      sort,
    });
  }

  const { data, meta } = await getCustomers({
    searchQuery: query,
    sort,
    to: pageSize,
  });

  const hasNextPage = Boolean(
    meta?.count && meta.count / (page + 1) > pageSize,
  );

  if (!data?.length) {
    if (
      query?.length ||
      Object.values(filter).some((value) => value !== null)
    ) {
      return <NoResults />;
    }

    return <EmptyState />;
  }

  return (
    <DataTable
      data={data}
      loadMore={loadMore}
      pageSize={pageSize}
      hasNextPage={hasNextPage}
      page={page}
    />
  );
}
