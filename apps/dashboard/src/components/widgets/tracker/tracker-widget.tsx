"use client";

import { TrackerMonthGraph } from "@/components/tracker-month-graph";
import { useRouter } from "next/navigation";

export function TrackerWidget({ data, date }) {
  const router = useRouter();

  const onSelect = ({ projectId, date }) => {
    router.push(`/tracker?projectId=${projectId}&date=${date}`);
  };

  return (
    <TrackerMonthGraph
      disableButton
      date={date}
      onSelect={onSelect}
      data={data}
    />
  );
}
