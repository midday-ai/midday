import { DataTable } from "@/components/tables/tracker/data-table";
import { getCountryInfo } from "@midday/location";
import { getTrackerProjects, getUser } from "@midday/supabase/cached-queries";
import { EmptyState, NoResults } from "./empty-states";

const pageSize = 20;

export async function Table({ status, sort, query }) {
  const { currencyCode } = getCountryInfo();
  const { data: userData } = await getUser();
  const { data, meta } = await getTrackerProjects({
    from: 0,
    to: pageSize,
    sort,
    filter: { status },
    search: {
      query,
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
    });
  }

  if (!data?.length && !query?.length) {
    return <EmptyState currencyCode={currencyCode} user={userData} />;
  }

  if (!data?.length && query?.length) {
    return <NoResults currencyCode={currencyCode} user={userData} />;
  }

  return (
    <DataTable
      data={data}
      currencyCode={currencyCode}
      pageSize={pageSize}
      loadMore={loadMore}
      meta={meta}
      user={userData}
    />
  );
}
