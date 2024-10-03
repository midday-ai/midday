import { useTrackerParams } from "@/hooks/use-tracker-params";
import { TZDate } from "@date-fns/tz";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { addMonths, format, formatISO, startOfMonth } from "date-fns";

type Props = {
  className?: string;
  dateFormat?: string;
};

export function TrackerMonthSelect({ className, dateFormat = "MMM" }: Props) {
  const { date, setParams } = useTrackerParams();
  const currentDate = date
    ? new TZDate(date, "UTC")
    : new TZDate(new Date(), "UTC");

  const selectPrevMonth = () => {
    setParams(
      {
        date: formatISO(startOfMonth(addMonths(currentDate, -1)), {
          representation: "date",
        }),
      },
      { shallow: false },
    );
  };

  const selectNextMonth = () => {
    setParams(
      {
        date: formatISO(startOfMonth(addMonths(currentDate, 1)), {
          representation: "date",
        }),
      },
      { shallow: false },
    );
  };

  return (
    <div className={cn("flex items-center border h-9", className)}>
      <Button
        variant="ghost"
        size="icon"
        className="p-0 w-6 h-6 hover:bg-transparent mr-4 ml-2"
        onClick={selectPrevMonth}
      >
        <Icons.ChevronLeft className="w-6 h-6" />
      </Button>
      <span className="w-full text-center">
        {format(currentDate, dateFormat)}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="p-0 w-6 h-6 hover:bg-transparent ml-4 mr-2"
        onClick={selectNextMonth}
      >
        <Icons.ChevronRight className="w-6 h-6" />
      </Button>
    </div>
  );
}
