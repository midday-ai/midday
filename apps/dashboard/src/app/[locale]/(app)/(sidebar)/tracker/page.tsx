import { OpenTrackerSheet } from "@/components/open-tracker-sheet";
import { Table } from "@/components/tables/tracker";
import { Loading } from "@/components/tables/tracker/loading";
import { TrackerCalendar } from "@/components/tracker-calendar";
import { TrackerSearchFilter } from "@/components/tracker-search-filter";
import {
  getTrackerRecordsByRange,
  getUser,
} from "@midday/supabase/cached-queries";
import { endOfMonth, formatISO, startOfMonth } from "date-fns";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Tracker | Midday",
};

type Props = {
  searchParams: {
    statuses: string;
    sort: string;
    q: string;
    start?: string;
    end?: string;
  };
};

export default async function Tracker({ searchParams }: Props) {
  const status = searchParams?.statuses;
  const sort = searchParams?.sort?.split(":") ?? ["status", "asc"];

  const currentDate =
    searchParams?.date ?? formatISO(new Date(), { representation: "date" });
  const [{ data: userData }, { data, meta }] = await Promise.all([
    getUser(),
    getTrackerRecordsByRange({
      from: formatISO(startOfMonth(new Date(currentDate)), {
        representation: "date",
      }),
      to: formatISO(endOfMonth(new Date(currentDate)), {
        representation: "date",
      }),
    }),
  ]);

  return (
    <div>
      <TrackerCalendar
        teamId={userData?.team_id}
        userId={userData?.id}
        weekStartsOnMonday={userData?.week_starts_on_monday}
        timeFormat={userData?.time_format}
        data={data}
        meta={meta}
      />

      <div className="mt-14 mb-6 flex items-center justify-between space-x-4">
        <h2 className="text-md font-medium">Projects</h2>

        <div className="flex space-x-2">
          <TrackerSearchFilter />
          <OpenTrackerSheet />
        </div>
      </div>

      <Suspense key={status} fallback={<Loading />}>
        <Table
          status={status}
          sort={sort}
          q={searchParams?.q}
          start={searchParams?.start}
          end={searchParams?.end}
          userId={userData?.id}
        />
      </Suspense>
    </div>
  );
}
