"use client";

import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { addMonths, format, formatISO, subMonths } from "date-fns";

export function TrackerPagination({ numberOfMonths, onChange, startDate }) {
  const currentDate = new Date(startDate);

  const selectPrevPeriod = () => {
    onChange({
      from: formatISO(subMonths(currentDate, numberOfMonths), {
        representation: "date",
      }),
      to: formatISO(startDate, {
        representation: "date",
      }),
    });
  };

  const selectNextPeriod = () => {
    onChange({
      from: formatISO(addMonths(currentDate, numberOfMonths), {
        representation: "date",
      }),
      to: formatISO(addMonths(currentDate, numberOfMonths * 2), {
        representation: "date",
      }),
    });
  };

  return (
    <div className="flex items-center border rounded-md h-9">
      <Button
        variant="ghost"
        size="icon"
        className="p-0 w-6 h-6 hover:bg-transparent mr-4 ml-2"
        onClick={selectPrevPeriod}
      >
        <Icons.ChevronLeft className="w-6 h-6" />
      </Button>
      <span className="w-full text-center">
        {format(subMonths(currentDate, numberOfMonths), "MMM")} -{" "}
        {format(currentDate, "MMM")}
      </span>
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
