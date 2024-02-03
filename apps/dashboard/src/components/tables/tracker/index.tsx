import { DataTable } from "@/components/tables/tracker/data-table";
import { getCountryInfo } from "@midday/location";
import { getTrackerProjects } from "@midday/supabase/cached-queries";
import { EmptyState } from "./empty-state";

const pageSize = 10;

export async function Table({ page, initialTrackerId, status, sort }) {
  const { currencyCode } = getCountryInfo();
  const { data, meta } = await getTrackerProjects({
    from: 0,
    to: pageSize,
    sort,
    filter: { status },
  });

  async function loadMore({ from, to }) {
    "use server";

    return getTrackerProjects({
      to,
      from,
      sort,
      filter: { status },
    });
  }

  if (!data?.length) {
    return <EmptyState currencyCode={currencyCode} />;
  }

  return (
    <DataTable
      data={data}
      initialTrackerId={initialTrackerId}
      currencyCode={currencyCode}
      pageSize={pageSize}
      loadMore={loadMore}
      meta={meta}
    />
  );
}
