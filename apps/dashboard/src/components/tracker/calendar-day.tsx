import type { RouterOutputs } from "@/trpc/routers/_app";
import type { TZDate } from "@date-fns/tz";
import { cn } from "@midday/ui/cn";
import { format, formatISO, isToday } from "date-fns";
import { useCallback } from "react";
import { TrackerEvents } from "./events";
import {
  checkIsFirstSelectedDate,
  checkIsInRange,
  checkIsLastSelectedDate,
} from "./utils";

type CalendarDayProps = {
  date: TZDate;
  currentDate: TZDate;
  selectedDate: string | null;
  dayData:
    | RouterOutputs["tracker"]["recordsByRange"]["result"][string]
    | undefined;
  range: [string, string] | null;
  localRange: [string | null, string | null];
  isDragging: boolean;
  handleMouseDown: (date: TZDate) => void;
  handleMouseEnter: (date: TZDate) => void;
  handleMouseUp: () => void;
};

export function CalendarDay({
  date,
  currentDate,
  selectedDate,
  dayData,
  range,
  localRange,
  isDragging,
  handleMouseDown,
  handleMouseEnter,
  handleMouseUp,
}: CalendarDayProps) {
  const isCurrentMonth = date.getMonth() === currentDate.getMonth();
  const formattedDate = formatISO(date, { representation: "date" });

  const isInRange = useCallback(
    (date: TZDate) => checkIsInRange(date, isDragging, localRange, range),
    [isDragging, localRange, range],
  );

  const isFirstSelectedDate = useCallback(
    (date: TZDate) =>
      checkIsFirstSelectedDate(date, isDragging, localRange, range),
    [isDragging, localRange, range],
  );

  const isLastSelectedDate = useCallback(
    (date: TZDate) =>
      checkIsLastSelectedDate(date, isDragging, localRange, range),
    [isDragging, localRange, range],
  );

  return (
    <div
      onMouseDown={() => handleMouseDown(date)}
      onMouseEnter={() => handleMouseEnter(date)}
      onMouseUp={handleMouseUp}
      className={cn(
        "aspect-square md:aspect-[4/2] pt-2 pb-10 px-3 font-mono text-lg relative transition-all duration-100 text-left flex space-x-2 select-none",
        isCurrentMonth && isToday(date)
          ? "bg-[#f0f0f0] dark:bg-[#202020]"
          : "bg-background",
        !isCurrentMonth &&
          "bg-[repeating-linear-gradient(-60deg,#DBDBDB,#DBDBDB_1px,transparent_1px,transparent_5px)] dark:bg-[repeating-linear-gradient(-60deg,#2C2C2C,#2C2C2C_1px,transparent_1px,transparent_5px)]",
        selectedDate === formattedDate && "ring-1 ring-primary",
        isInRange(date) && "ring-1 ring-primary bg-opacity-50",
        isFirstSelectedDate(date) && "ring-1 ring-primary bg-opacity-50",
        isLastSelectedDate(date) && "ring-1 ring-primary bg-opacity-50",
      )}
    >
      <div>{format(date, "d")}</div>
      <TrackerEvents data={dayData} isToday={isToday(date)} />
    </div>
  );
}
