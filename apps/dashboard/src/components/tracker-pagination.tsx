"use client";

import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import {
  addMonths,
  format,
  formatISO,
  startOfMonth,
  subMonths,
} from "date-fns";

export function TrackerPagination({ numberOfMonths, onChange, startDate }) {
  const selectPrevPeriod = () => {
    onChange(
      formatISO(startOfMonth(subMonths(startDate, numberOfMonths)), {
        representation: "date",
      })
    );
  };

  const selectNextPeriod = () => {
    onChange(
      formatISO(startOfMonth(addMonths(startDate, numberOfMonths)), {
        representation: "date",
      })
    );
  };

  return (
    <div className="flex items-center border h-9">
      <Button
        variant="ghost"
        size="icon"
        className="p-0 w-6 h-6 hover:bg-transparent mr-4 ml-2"
        onClick={selectPrevPeriod}
      >
        <Icons.ChevronLeft className="w-6 h-6" />
      </Button>
      <span className="w-full text-center">
        {format(subMonths(startDate, numberOfMonths), "MMM")} -{" "}
        {format(startDate, "MMM")}
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
