import { OpenTrackerSheet } from "@/components/open-tracker-sheet";
import { DataTable } from "@/components/tables/tracker";
import { Loading } from "@/components/tables/tracker/loading";
import { TrackerCalendar } from "@/components/tracker-calendar";
import { TrackerSearchFilter } from "@/components/tracker-search-filter";
import { loadSortParams } from "@/hooks/use-sort-params";
import { loadUserTrackerFilterParams } from "@/hooks/user-tracker-filter-params";
import { prefetch, trpc } from "@/trpc/server";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Tracker | Midday",
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page(props: Props) {
  const searchParams = await props.searchParams;
  const filter = loadUserTrackerFilterParams(searchParams);
  const { sort } = loadSortParams(searchParams);

  prefetch(
    trpc.trackerProjects.get.infiniteQueryOptions({
      filter,
      sort,
    }),
  );

  return (
    <div>
      <TrackerCalendar />

      <div className="mt-14 mb-6 flex items-center justify-between space-x-4">
        <h2 className="text-md font-medium">Projects</h2>

        <div className="flex space-x-2">
          <TrackerSearchFilter />
          <OpenTrackerSheet />
        </div>
      </div>

      <Suspense fallback={<Loading />}>
        <DataTable />
      </Suspense>
    </div>
  );
}
