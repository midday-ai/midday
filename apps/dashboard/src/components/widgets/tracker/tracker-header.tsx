"use client";

import { TrackerMonthSelect } from "@/components/tracker-month-select";
import { Icons } from "@midday/ui/icons";
import MotionNumber from "motion-number";

type Props = {
  totalDuration?: number;
};

export function TrackerHeader({ totalDuration }: Props) {
  return (
    <div className="flex justify-between">
      <div>
        <h2 className="text-lg">Tracker</h2>
        <span className="text-[#878787]">
          <MotionNumber value={totalDuration ? totalDuration / 3600 : 0} />h
        </span>

        <Icons.MoreHoriz />
      </div>

      <TrackerMonthSelect />
    </div>
  );
}
