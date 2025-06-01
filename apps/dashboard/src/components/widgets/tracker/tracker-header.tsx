"use client";

import { TrackerPeriodSelect } from "@/components/tracker-period-select";
import NumberFlow from "@number-flow/react";

type TrackerHeaderProps = {
  totalDuration?: number;
};

export function TrackerHeader({ totalDuration }: TrackerHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <h2 className="text-xl text-[#878787]">
          <NumberFlow
            value={totalDuration ? Math.round(totalDuration / 3600) : 0}
          />
          <span className="relative">h</span>
        </h2>
      </div>
      <div className="flex items-center space-x-2">
        <TrackerPeriodSelect />
      </div>
    </div>
  );
}
