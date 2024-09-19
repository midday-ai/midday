import { useTrackerParams } from "@/hooks/use-tracker-params";
import { getTrackerDates } from "@/utils/tracker";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { addDays, format, formatISO, subDays } from "date-fns";
import { formatDateRange } from "little-date";
import { useHotkeys } from "react-hotkeys-hook";

type Props = {
  className?: string;
};

export function TrackerDaySelect({ className }: Props) {
  const { setParams, range, selectedDate } = useTrackerParams();
  const currentDate = getTrackerDates(range, selectedDate);

  const selectPrevDay = () => {
    if (currentDate[0]) {
      setParams({
        selectedDate: formatISO(subDays(currentDate[0], 1), {
          representation: "date",
        }),
        range: null,
      });
    }
  };

  const selectNextDay = () => {
    if (currentDate[0]) {
      setParams({
        selectedDate: formatISO(addDays(currentDate[0], 1), {
          representation: "date",
        }),
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
        {currentDate.length > 1 && currentDate[0] && currentDate[1]
          ? formatDateRange(currentDate[0], currentDate[1], {
              includeTime: false,
            })
          : currentDate[0]
            ? format(currentDate[0], "MMM d")
            : ""}
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
