import { OpenTrackerSheet } from "@/components/open-tracker-sheet";
import { Table } from "@/components/tables/tracker";
import { Loading } from "@/components/tables/tracker/loading";
import { TrackerCalendar } from "@/components/tracker-calendar";
import { TrackerSearchFilter } from "@/components/tracker-search-filter";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Tracker | Midday",
};

type Props = {
  searchParams: {
    status: string;
    sort: string;
    q: string;
  };
};

export default async function Tracker({ searchParams }: Props) {
  const status = searchParams?.status;
  const sort = searchParams?.sort?.split(":");

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

      <Suspense key={status} fallback={<Loading />}>
        <Table status={status} sort={sort} query={searchParams?.q} />
      </Suspense>
    </div>
  );
}
