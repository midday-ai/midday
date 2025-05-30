import { useTrackerParams } from "@/hooks/use-tracker-params";
import { useUserQuery } from "@/hooks/use-user";
import { TZDate } from "@date-fns/tz";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import {
  addMonths,
  addWeeks,
  endOfWeek,
  format,
  formatISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";

type Props = {
  className?: string;
  dateFormat?: string;
};

export function TrackerPeriodSelect({ className, dateFormat = "MMM" }: Props) {
  const { date, view, setParams } = useTrackerParams();
  const { data: user } = useUserQuery();

  const weekStartsOnMonday = user?.weekStartsOnMonday ?? false;
  const currentDate = date
    ? new TZDate(date, "UTC")
    : new TZDate(new Date(), "UTC");

  const selectPrevPeriod = () => {
    if (view === "week") {
      setParams({
        date: formatISO(
          startOfWeek(addWeeks(currentDate, -1), {
            weekStartsOn: weekStartsOnMonday ? 1 : 0,
          }),
          {
            representation: "date",
          },
        ),
      });
    } else {
      setParams({
        date: formatISO(startOfMonth(addMonths(currentDate, -1)), {
          representation: "date",
        }),
      });
    }
  };

  const selectNextPeriod = () => {
    if (view === "week") {
      setParams({
        date: formatISO(
          startOfWeek(addWeeks(currentDate, 1), {
            weekStartsOn: weekStartsOnMonday ? 1 : 0,
          }),
          {
            representation: "date",
          },
        ),
      });
    } else {
      setParams({
        date: formatISO(startOfMonth(addMonths(currentDate, 1)), {
          representation: "date",
        }),
      });
    }
  };

  const getPeriodLabel = () => {
    if (view === "week") {
      const weekStart = startOfWeek(currentDate, {
        weekStartsOn: weekStartsOnMonday ? 1 : 0,
      });
      const weekEnd = endOfWeek(currentDate, {
        weekStartsOn: weekStartsOnMonday ? 1 : 0,
      });

      // If week spans across months, show both months
      if (weekStart.getMonth() !== weekEnd.getMonth()) {
        return `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`;
      }

      // If same month, show month once
      return `${format(weekStart, "MMM d")} - ${format(weekEnd, "d, yyyy")}`;
    }
    return format(currentDate, dateFormat);
  };

  return (
    <div className={cn("flex items-center border h-9", className)}>
      <Button
        variant="ghost"
        size="icon"
        className="p-0 w-6 h-6 hover:bg-transparent mr-4 ml-2"
        onClick={selectPrevPeriod}
      >
        <Icons.ChevronLeft className="w-6 h-6" />
      </Button>
      <span className="w-full text-center text-sm">{getPeriodLabel()}</span>
      <Button
        variant="ghost"
        size="icon"
        className="p-0 w-6 h-6 hover:bg-transparent ml-4 mr-2"
        onClick={selectNextPeriod}
      >
        <Icons.ChevronRight className="w-6 h-6" />
      </Button>
    </div>
  );
}
