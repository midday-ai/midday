"use client";

import { TrackerMonthGraph } from "@/components/tracker-month-graph";
import { useRouter, useSearchParams } from "next/navigation";

export function TrackerWidget({ data, date }) {
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

  return <TrackerMonthGraph date={date} onSelect={onSelect} data={data} />;
}
