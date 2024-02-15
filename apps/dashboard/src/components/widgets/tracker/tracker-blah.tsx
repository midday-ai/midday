"use client";

import { TrackerMonthGraph } from "@/components/tracker-month-graph";
import { useRouter, useSearchParams } from "next/navigation";
import { TrackerHeader } from "./tracker-header";

export function TrackerBlah({ date, data, meta }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const onSelect = ({ projectId, date }) => {
    const params = new URLSearchParams(searchParams);
    params.set("date", date);
    if (projectId) {
      params.set("projectId", projectId);
    } else {
      params.set("projectId", "new");
    }
    router.push(`/tracker?${params.toString()}`);
  };

  return (
    <div>
      <TrackerHeader
        date={date}
        // setDate={setDate}
        totalDuration={meta?.totalDuration}
      />

      <div className="mt-10">
        <TrackerMonthGraph date={date} data={data} onSelect={onSelect} />
      </div>
    </div>
  );
}
