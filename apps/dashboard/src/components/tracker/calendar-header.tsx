import NumberFlow from "@number-flow/react";
import { TrackerCalendarType } from "../tracker-calendar-type";
import { TrackerMonthSelect } from "../tracker-month-select";

type CalendarHeaderProps = {
  totalDuration?: number;
};

export function CalendarHeader({ totalDuration }: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="space-y-2 select-text">
        <h1 className="text-4xl font-mono">
          <NumberFlow
            value={totalDuration ? Math.round(totalDuration / 3600) : 0}
          />
          <span className="relative">h</span>
        </h1>
      </div>
      <div className="flex space-x-2">
        <TrackerMonthSelect dateFormat="MMMM" />
        <TrackerCalendarType />
      </div>
    </div>
  );
}
