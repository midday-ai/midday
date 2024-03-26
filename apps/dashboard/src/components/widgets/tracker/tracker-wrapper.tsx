"use client";

import { TrackerCreateSheet } from "@/components/sheets/tracker-create-sheet";
import { TrackerSheet } from "@/components/sheets/tracker-sheet";
import { TrackerMonthGraph } from "@/components/tracker-month-graph";
import { formatISO } from "date-fns";
import { parseAsString, useQueryStates } from "nuqs";
import { TrackerHeader } from "./tracker-header";

export function TrackerWrapper({
  date: initialDate,
  data,
  meta,
  user,
  currencyCode,
}) {
  const [params, setParams] = useQueryStates({
    date: parseAsString.withDefault(initialDate),
    create: parseAsString,
    projectId: parseAsString,
    update: parseAsString,
    day: parseAsString.withDefault(
      formatISO(new Date(), { representation: "date" })
    ),
  });

  return (
    <div>
      <TrackerHeader
        date={params.date}
        setDate={(date: string) => setParams({ date })}
        totalDuration={meta?.totalDuration}
      />

      <div className="mt-10">
        <TrackerMonthGraph
          date={params.date}
          data={data}
          onSelect={setParams}
        />
      </div>

      <TrackerCreateSheet
        setParams={setParams}
        currencyCode={currencyCode}
        isOpen={Boolean(params.create)}
      />

      <TrackerSheet
        isOpen={Boolean(params.projectId) && !params.update}
        params={params}
        setParams={setParams}
        user={user}
      />
    </div>
  );
}
