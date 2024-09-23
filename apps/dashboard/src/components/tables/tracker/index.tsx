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
};

export async function Table({ status, sort, q, start, end }: Props) {
  const hasFilters = Boolean(status || q);

  const { data, meta } = await getTrackerProjects({
    from: 0,
    to: pageSize,
    sort,
    start,
    end,
    filter: { status },
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
    />
  );
}
