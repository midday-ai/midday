"use client";

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

export function ChartPeriod({ initialValue, defaultValue }) {
  let placeholder;

  const [state, setState] = useQueryStates(
    {
      to: parseAsString.withDefault(initialValue?.to ?? undefined),
      from: parseAsString.withDefault(initialValue?.from ?? undefined),
      period: parseAsString.withDefault(
        initialValue?.period ?? defaultValue.period,
      ),
    },
    {
      shallow: false,
    },
  );

  if (state?.from) {
    placeholder = format(new Date(state.from), "LLL dd, y");
  } else {
    placeholder = format(new Date(defaultValue.from), "LLL dd, y");
  }

  if (state?.to) {
    placeholder = `${placeholder} -${format(new Date(state.to), "LLL dd, y")} `;
  } else {
    placeholder = `${placeholder} -${format(
      new Date(defaultValue.to),
      "LLL dd, y",
    )} `;
  }

  return (
    <div className="flex space-x-4">
      <DateRangePicker
        placeholder={placeholder}
        range={{
          from: state?.from && new Date(state.from),
          to: state?.to && new Date(state.to),
        }}
        onSelect={(range) => {
          setState({
            from: range?.from ? new Date(range.from).toISOString() : null,
            to: range?.to ? new Date(range.to).toISOString() : null,
          });
        }}
      />

      <Select
        defaultValue={state.period}
        onValueChange={(period) => setState({ period })}
      >
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
