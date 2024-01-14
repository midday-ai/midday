import { OpenTracker } from "@/components/open-tracker";
import { Table } from "@/components/tables/tracker";
import { TrackerGraph } from "@/components/tracker-graph";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Tracker | Midday",
};

export default function Tracker() {
  return (
    <div>
      <TrackerGraph />

      <div className="mt-14 mb-6 flex items-center justify-between">
        <h2 className="text-xl">Projects</h2>
        <div className="flex space-x-2">
          <Select>
            <SelectTrigger className="min-w-[120px]">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <div>
            <OpenTracker />
          </div>
        </div>
      </div>

      <Suspense>
        <Table />
      </Suspense>
    </div>
  );
}
