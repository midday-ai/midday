import type { Metadata } from "next";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { cookies } from "next/headers";
import type { SearchParams } from "nuqs";
import { Suspense } from "react";
import { ErrorFallback } from "@/components/error-fallback";
import { OpenTrackerSheet } from "@/components/open-tracker-sheet";
import { ScrollableContent } from "@/components/scrollable-content";
import { DataTable } from "@/components/tables/tracker";
import { Loading } from "@/components/tables/tracker/loading";
import { TrackerCalendar } from "@/components/tracker-calendar";
import { TrackerSearchFilter } from "@/components/tracker-search-filter";
import { loadSortParams } from "@/hooks/use-sort-params";
import { loadTrackerFilterParams } from "@/hooks/use-tracker-filter-params";
import { prefetch, trpc } from "@/trpc/server";
import { Cookies } from "@/utils/constants";

export const metadata: Metadata = {
  title: "Tracker | Midday",
};

type Props = {
  searchParams: Promise<SearchParams>;
};

export default async function Page(props: Props) {
  const searchParams = await props.searchParams;
  const filter = loadTrackerFilterParams(searchParams);
  const { sort } = loadSortParams(searchParams);
  const weeklyCalendar = (await cookies()).get(Cookies.WeeklyCalendar);

  prefetch(
    trpc.trackerProjects.get.infiniteQueryOptions({
      ...filter,
      sort,
    }),
  );

  return (
    <ScrollableContent>
      <TrackerCalendar weeklyCalendar={weeklyCalendar?.value === "true"} />

      <div className="mt-14 mb-6 flex items-center justify-between space-x-4">
        <h2 className="text-md font-medium">Projects</h2>

        <div className="flex space-x-2">
          <TrackerSearchFilter />
          <OpenTrackerSheet />
        </div>
      </div>

      <ErrorBoundary errorComponent={ErrorFallback}>
        <Suspense fallback={<Loading />}>
          <DataTable />
        </Suspense>
      </ErrorBoundary>
    </ScrollableContent>
  );
}
