"use client";

import * as React from "react";
import { DateRange } from "react-day-picker";
import { cn } from "../utils";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Icons } from "./icons";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

type Props = {
  range: DateRange;
  className: React.HTMLAttributes<HTMLDivElement>;
  onSelect: (range?: DateRange) => void;
  defaultValue: string;
  placeholder: string;
};

export function DateRangePicker({
  className,
  range,
  onSelect,
  defaultValue,
  placeholder,
}: Props) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-medium space-x-2",
              !defaultValue && "text-[#606060]",
            )}
          >
            <span>{defaultValue ?? placeholder}</span>
            <Icons.ChevronDown />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 mt-2" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={range?.from}
            selected={range}
            onSelect={onSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
