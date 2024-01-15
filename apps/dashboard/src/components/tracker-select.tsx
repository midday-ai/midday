import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { cn } from "@midday/ui/utils";
import format from "date-fns/format";

export function TrackerSelect({ date, className }) {
  return (
    <div className={cn("flex items-center border rounded-md h-9", className)}>
      <Button
        variant="ghost"
        size="icon"
        className="p-0 w-6 h-6 hover:bg-transparent mr-4 ml-2"
      >
        <Icons.ChevronLeft className="w-6 h-6" />
      </Button>
      <span className="w-full text-center">
        {format(new Date(date), "MMMM")}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="p-0 w-6 h-6 hover:bg-transparent ml-4 mr-2"
      >
        <Icons.ChevronRight className="w-6 h-6" />
      </Button>
    </div>
  );
}
