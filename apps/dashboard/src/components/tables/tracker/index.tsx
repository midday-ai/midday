import { DataTable } from "@/components/tables/tracker/data-table";
import { getTrackerProjects } from "@midday/supabase/cached-queries";
import { EmptyState, NoResults } from "./empty-states";

const pageSize = 20;

type Props = {
  status?: string;
  sort?: string;
  q?: string;
  start?: string;
  end?: string;
  userId: string;
  customerIds?: string[];
};

export async function Table({
  status,
  sort,
  q,
  start,
  end,
  userId,
  customerIds,
}: Props) {
  const hasFilters = Boolean(status || q);

  const { data, meta } = await getTrackerProjects({
    from: 0,
    to: pageSize,
    sort,
    start,
    end,
    filter: { status, customers: customerIds },
    search: {
      query: q,
      fuzzy: true,
    },
  });

  async function loadMore({ from, to }) {
    "use server";

    return getTrackerProjects({
      to,
      from: from + 1,
      sort,
      filter: {
        status,
        customers: customerIds,
      },
      search: {
        query: q,
        fuzzy: true,
      },
    });
  }

  if (!data?.length && !hasFilters) {
    return <EmptyState />;
  }

  if (!data?.length && hasFilters) {
    return <NoResults />;
  }

  return (
    <DataTable
      data={data}
      pageSize={pageSize}
      loadMore={loadMore}
      meta={meta}
      userId={userId}
    />
  );
}
