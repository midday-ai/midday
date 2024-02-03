import { DataTable } from "@/components/tables/tracker/data-table";
import { getCountryInfo } from "@midday/location";
import { getTrackerProjects } from "@midday/supabase/cached-queries";

const pageSize = 20;

export async function Table({ page, initialTrackerId, status }) {
  const { currencyCode } = getCountryInfo();
  const trackerProjects = await getTrackerProjects({
    to: 25,
    filter: { status },
  });

  //   if (!data?.length) {
  //     return <NoResults hasFilters={hasFilters} />;
  //   }

  const hasNextPage = trackerProjects?.meta?.count / (page + 1) > pageSize;

  return (
    <div className="relative">
      <DataTable
        records={trackerProjects?.data}
        initialTrackerId={initialTrackerId}
        currencyCode={currencyCode}
        hasNextPage={hasNextPage}
      />
    </div>
  );
}
