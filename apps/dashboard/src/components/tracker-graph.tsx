"use client";

import { parseAsString, useQueryStates } from "next-usequerystate";
import { TrackerMonthGraph } from "./tracker-month-graph";

export function TrackerGraph({ data }) {
  const [params, setParams] = useQueryStates(
    {
      date: parseAsString,
      id: parseAsString,
    },
    {
      shallow: true,
    }
  );

  const onSelect = (params) => {
    setParams(params);
  };

  return (
    <div>
      <div className="mt-8">
        <h2 className="font-medium text-[#878787] text-xl mb-2">Total hours</h2>
        <div className="text-[#F5F5F3] text-4xl">294</div>
      </div>

      <div className="flex row space-x-[45px] mt-8">
        <TrackerMonthGraph
          disableButton
          date="2023-07-01"
          onSelect={onSelect}
          records={data}
        />
        <TrackerMonthGraph
          disableButton
          date="2023-08-01"
          onSelect={onSelect}
          records={data}
        />
        <TrackerMonthGraph
          disableButton
          date="2023-09-01"
          onSelect={onSelect}
          records={data}
        />
        <TrackerMonthGraph
          disableButton
          date="2023-11-01"
          onSelect={onSelect}
          records={data}
        />
        <TrackerMonthGraph
          disableButton
          date="2023-12-01"
          onSelect={onSelect}
          records={data}
        />
        <TrackerMonthGraph
          disableButton
          date="2024-01-01"
          onSelect={onSelect}
          records={data}
        />
      </div>
    </div>
  );
}
