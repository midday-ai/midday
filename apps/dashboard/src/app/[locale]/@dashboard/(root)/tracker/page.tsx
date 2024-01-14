import { Table } from "@/components/tables/tracker";
import { TrackerGraph } from "@/components/tracker-graph";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Tracker | Midday",
};

export default function Tracker() {
  return (
    <div>
      <TrackerGraph />

      <div className="mt-14 mb-6">
        <h2 className="text-xl">Projects</h2>
      </div>

      <Suspense>
        <Table />
      </Suspense>
    </div>
  );
}
