"use client";

import { TrackerMonthGraph } from "@/components/tracker-month-graph";
import { useRouter } from "next/navigation";

export function TrackerWidget({ data, date }) {
  const router = useRouter();

  const onSelect = ({ id, date }) => {
    router.push(`/tracker?projectId=${id}&date=${date}`);
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
