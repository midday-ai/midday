"use client";

import { TrackerSelect } from "@/components/tracker-select";
import { secondsToHoursAndMinutes } from "@/utils/format";
import { formatISO } from "date-fns";
import { parseAsString, useQueryStates } from "nuqs";

export function TrackerHeader({ date: initialDate, totalDuration }) {
  const [params, setParams] = useQueryStates(
    {
      date: parseAsString.withDefault(initialDate),
      create: parseAsString,
      projectId: parseAsString,
      update: parseAsString,
      day: parseAsString.withDefault(
        formatISO(new Date(), { representation: "date" }),
      ),
    },
    { shallow: false },
  );

  return (
    <div className="flex justify-between">
      <div>
        <h2 className="text-lg">Tracker</h2>
        <span className="text-[#878787]">
          {secondsToHoursAndMinutes(totalDuration)}
        </span>
      </div>

      <TrackerSelect
        date={params?.date}
        onSelect={(date: string) => setParams({ date })}
        disableKeyboard
      />
    </div>
  );
}
