import { OpenTracker } from "@/components/open-tracker";
import { SearchField } from "@/components/search-field";
import { Table } from "@/components/tables/tracker";
import { Loading } from "@/components/tables/tracker/loading";
import { TrackerChangeStatus } from "@/components/tracker-change-status";
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
      <div className="mt-14 mb-6 flex items-center justify-between space-x-4">
        <SearchField placeholder="Search projects" />
        <div className="flex space-x-2">
          <TrackerChangeStatus />
          <OpenTracker />
        </div>
      </div>

      <Suspense key={status} fallback={<Loading />}>
        <Table status={status} sort={sort} query={searchParams?.q} />
      </Suspense>
    </div>
  );
}
