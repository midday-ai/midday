"use client";

import { TrackerMonthGraph } from "@/components/tracker-month-graph";
import { useRouter, useSearchParams } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { TrackerHeader } from "./tracker-header";

export function TrackerWrapper({ date: initialDate, data, meta }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [date, setDate] = useQueryState(
    "date",
    parseAsString.withDefault(initialDate)
  );

  const onSelect = ({ projectId, day }) => {
    const params = new URLSearchParams(searchParams);
    params.set("day", day);

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
        setDate={(d: string) => setDate(d, { shallow: false })}
        totalDuration={meta?.totalDuration}
      />

      <div className="mt-10">
        <TrackerMonthGraph date={date} data={data} onSelect={onSelect} />
      </div>
    </div>
  );
}
