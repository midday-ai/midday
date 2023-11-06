"use client";

import * as React from "react";
import { DateRange } from "react-day-picker";
import { cn } from "../utils";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Icons } from "./icons";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

type Props = {
  date: DateRange;
  className: React.HTMLAttributes<HTMLDivElement>;
  setDate: (range?: DateRange) => void;
  formattedValue: string;
};

export function DateRangePicker({
  className,
  date,
  setDate,
  formattedValue,
}: Props) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="justify-start text-left font-medium space-x-2"
          >
            <span>{formattedValue}</span>
            <Icons.ChevronDown />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 mt-2" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
