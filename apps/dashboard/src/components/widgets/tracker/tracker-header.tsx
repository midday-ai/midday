"use client";

import { TrackerMonthSelect } from "@/components/tracker-month-select";
import { useTrackerParams } from "@/hooks/use-tracker-params";
import { secondsToHoursAndMinutes } from "@/utils/format";

type Props = {
  date?: string;
  totalDuration?: number;
};

export function TrackerHeader({ date: initialDate, totalDuration }: Props) {
  const { date, setParams } = useTrackerParams(initialDate);

  return (
    <div className="flex justify-between">
      <div>
        <h2 className="text-lg">Tracker</h2>
        <span className="text-[#878787]">
          {secondsToHoursAndMinutes(totalDuration ?? 0)}
        </span>
      </div>

      <TrackerMonthSelect
        date={date}
        onSelect={(date: string) => setParams({ date })}
        disableKeyboard
      />
    </div>
  );
}
