"use client";

// import { changeChartPeriodAction } from "@/actions/change-chart-period";
import { DateRangePicker } from "@midday/ui/date-range-picker";
import { Icons } from "@midday/ui/icons";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { format } from "date-fns";
import { parseAsString, useQueryStates } from "next-usequerystate";
import { useState } from "react";

export function ChartPeriod({ initialValue, defaultRange }) {
  let defaultValue;

  const [range, setRange] = useQueryStates(
    {
      to: parseAsString.withDefault(initialValue?.to ?? undefined),
      from: parseAsString.withDefault(initialValue?.from ?? undefined),
    },
    {
      shallow: false,
    },
  );

  if (range?.from) {
    defaultValue = format(new Date(range.from), "LLL dd, y");
  } else {
    defaultValue = format(new Date(defaultRange.from), "LLL dd, y");
  }

  if (range?.to) {
    defaultValue = `${defaultValue} -${format(
      new Date(range.to),
      "LLL dd, y",
    )} `;
  } else {
    defaultValue = `${defaultValue} -${format(
      new Date(defaultRange.to),
      "LLL dd, y",
    )} `;
  }

  return (
    <div className="flex space-x-4">
      <DateRangePicker
        defaultValue={defaultValue}
        range={{
          from: range?.from && new Date(range.from),
          to: range?.to && new Date(range.to),
        }}
        onSelect={(range) => {
          setRange({
            from: range?.from ? new Date(range.from).toISOString() : null,
            to: range?.to ? new Date(range.to).toISOString() : null,
          });
        }}
      />

      <Select>
        <SelectTrigger className="w-[130px] font-medium">
          <SelectValue placeholder="Monthly" />
        </SelectTrigger>
        <SelectContent className="mt-1">
          <SelectGroup>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
