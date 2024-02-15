import { OpenTracker } from "@/components/open-tracker";
import { SearchField } from "@/components/search-field";
import { Table } from "@/components/tables/tracker";
import { Loading } from "@/components/tables/tracker/loading";
import { TrackerChangeStatus } from "@/components/tracker-change-status";
import { TrackerGraph } from "@/components/tracker-graph";
import { getUser } from "@midday/supabase/cached-queries";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Tracker | Midday",
};

export default async function Tracker({ searchParams }) {
  const status = searchParams?.status;
  const sort = searchParams?.sort?.split(":");
  const user = await getUser();

  return (
    <div>
      <TrackerGraph teamId={user?.data.team_id} />

      <div className="mt-14 mb-6 flex items-center justify-between">
        <SearchField placeholder="Search projects" />
        <div className="flex space-x-2">
          <TrackerChangeStatus />
          <OpenTracker />
        </div>
      </div>

      <Suspense key={`${status}-${status}`} fallback={<Loading />}>
        <Table status={status} sort={sort} query={searchParams?.q} />
      </Suspense>
    </div>
  );
}
