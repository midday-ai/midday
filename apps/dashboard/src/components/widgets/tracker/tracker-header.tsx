"use client";

import { TrackerMonthSelect } from "@/components/tracker-month-select";
import { secondsToHoursAndMinutes } from "@/utils/format";

type Props = {
  totalDuration?: number;
};

export function TrackerHeader({ totalDuration }: Props) {
  return (
    <div className="flex justify-between">
      <div>
        <h2 className="text-lg">Tracker</h2>
        <span className="text-[#878787] text-sm">
          {totalDuration ? secondsToHoursAndMinutes(totalDuration) : "0h"}
        </span>
      </div>

      <TrackerMonthSelect />
    </div>
  );
}
