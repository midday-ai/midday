"use client";

import { TrackerMonthGraph } from "@/components/tracker-month-graph";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function TrackerWidget() {
  const router = useRouter();
  const [currentDate, setDate] = useState(new Date().toString());

  const onSelect = ({ id, date }) => {
    router.push(`/tracker?id=${id}&date=${date}`);
  };

  return <TrackerMonthGraph date={currentDate} onSelect={onSelect} />;
}
