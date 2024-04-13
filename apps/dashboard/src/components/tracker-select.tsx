import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import {
  addDays,
  addMonths,
  format,
  formatISO,
  startOfMonth,
  subDays,
  subMonths,
} from "date-fns";
import { useHotkeys } from "react-hotkeys-hook";

export function TrackerSelect({ date, className, onSelect, disableKeyboard }) {
  const currentDate = date ? new Date(date) : new Date();

  const selectPrevMonth = () => {
    onSelect(
      formatISO(startOfMonth(subMonths(currentDate, 1)), {
        representation: "date",
      })
    );
  };

  const selectNextMonth = () => {
    onSelect(
      formatISO(startOfMonth(addMonths(currentDate, 1)), {
        representation: "date",
      })
    );
  };

  const selectPrevDay = () => {
    if (disableKeyboard) {
      return null;
    }

    onSelect(
      formatISO(subDays(currentDate, 1), {
        representation: "date",
      })
    );
  };

  const selectNextDay = () => {
    if (disableKeyboard) {
      return null;
    }

    onSelect(
      formatISO(addDays(currentDate, 1), {
        representation: "date",
      })
    );
  };

  useHotkeys("arrowLeft", selectPrevDay);
  useHotkeys("arrowRight", selectNextDay);

  return (
    <div className={cn("flex items-center border rounded-md h-9", className)}>
      <Button
        variant="ghost"
        size="icon"
        className="p-0 w-6 h-6 hover:bg-transparent mr-4 ml-2"
        onClick={selectPrevMonth}
      >
        <Icons.ChevronLeft className="w-6 h-6" />
      </Button>
      <span className="w-full text-center">{format(currentDate, "MMMM")}</span>
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
