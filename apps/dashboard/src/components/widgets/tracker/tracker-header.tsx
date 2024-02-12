"use client";

import { TrackerSelect } from "@/components/tracker-select";
import { secondsToHoursAndMinutes } from "@/utils/format";

export function TrackerHeader({ date, setDate, totalDuration }) {
  return (
    <div className="flex justify-between">
      <div>
        <h2 className="text-lg">Tracker</h2>
        <span className="text-[#878787]">
          {secondsToHoursAndMinutes(totalDuration)}
        </span>
      </div>

      <TrackerSelect date={date} onSelect={setDate} />
    </div>
  );
}
