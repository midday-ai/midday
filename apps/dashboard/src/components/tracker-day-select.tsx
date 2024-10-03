import { useTrackerParams } from "@/hooks/use-tracker-params";
import { formatDateRange } from "@/utils/format";
import { getTrackerDates } from "@/utils/tracker";
import { TZDate } from "@date-fns/tz";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { addDays, formatISO, subDays } from "date-fns";
import { useHotkeys } from "react-hotkeys-hook";

type Props = {
  className?: string;
};

export function TrackerDaySelect({ className }: Props) {
  const { setParams, range, selectedDate } = useTrackerParams();
  const currentDate = getTrackerDates(range, selectedDate);

  const selectPrevDay = () => {
    if (currentDate[0]) {
      const prevDay = new TZDate(subDays(currentDate[0], 1), "UTC");
      setParams({
        selectedDate: formatISO(prevDay, { representation: "date" }),
        range: null,
      });
    }
  };

  const selectNextDay = () => {
    if (currentDate[0]) {
      const nextDay = new TZDate(addDays(currentDate[0], 1), "UTC");
      setParams({
        selectedDate: formatISO(nextDay, { representation: "date" }),
        range: null,
      });
    }
  };

  useHotkeys("arrowLeft", selectPrevDay);
  useHotkeys("arrowRight", selectNextDay);

  return (
    <div className={cn("flex items-center border h-9", className)}>
      <Button
        variant="ghost"
        size="icon"
        className="p-0 w-6 h-6 hover:bg-transparent mr-4 ml-2"
        onClick={selectPrevDay}
      >
        <Icons.ChevronLeft className="w-6 h-6" />
      </Button>
      <span className="w-full text-center">
        {formatDateRange(
          range
            ? [
                new TZDate(currentDate[0].getTime(), "UTC"),
                new TZDate(
                  currentDate[1]?.getTime() ?? currentDate[0].getTime(),
                  "UTC",
                ),
              ]
            : [new TZDate(currentDate[0].getTime(), "UTC")],
        )}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="p-0 w-6 h-6 hover:bg-transparent ml-4 mr-2"
        onClick={selectNextDay}
      >
        <Icons.ChevronRight className="w-6 h-6" />
      </Button>
    </div>
  );
}
