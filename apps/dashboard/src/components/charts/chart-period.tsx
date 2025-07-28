"use client";

import {
  chartPeriodOptions,
  useMetricsParams,
} from "@/hooks/use-metrics-params";
import { useUserQuery } from "@/hooks/use-user";
import { Button } from "@midday/ui/button";
import { Calendar } from "@midday/ui/calendar";
import { Icons } from "@midday/ui/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { formatISO } from "date-fns";
import { formatDateRange } from "little-date";
import type { DateRange } from "react-day-picker";

type Props = {
  disabled?: string;
};

export function ChartPeriod({ disabled }: Props) {
  const { params, setParams } = useMetricsParams();
  const { data: user } = useUserQuery();

  const handleChangePeriod = (
    range: DateRange | undefined,
    period?: string,
  ) => {
    const newRange = {
      from: range?.from
        ? formatISO(range.from, { representation: "date" })
        : params.from,
      to: range?.to
        ? formatISO(range.to, { representation: "date" })
        : params.to,
      period: period || params.period,
    };

    setParams(newRange);
  };

  // Handle calendar selection separately to match the expected type
  const handleCalendarSelect = (selectedRange: DateRange | undefined) => {
    handleChangePeriod(selectedRange);
  };

  return (
    <div className="flex space-x-4">
      <Popover>
        <PopoverTrigger asChild disabled={Boolean(disabled)}>
          <Button
            variant="outline"
            className="justify-start text-left font-medium space-x-2"
          >
            <span className="line-clamp-1 text-ellipsis">
              {params.from && params.to
                ? formatDateRange(new Date(params.from), new Date(params.to), {
                    includeTime: false,
                  })
                : "Select date range"}
            </span>
            <Icons.ChevronDown />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-screen md:w-[550px] p-0 flex-col flex space-y-4"
          align="end"
          sideOffset={10}
        >
          <div className="p-4 pb-0">
            <Select
              value={params.period ?? undefined}
              onValueChange={(value) =>
                handleChangePeriod(
                  chartPeriodOptions.find((p) => p.value === value)?.range,
                  value,
                )
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a period" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {chartPeriodOptions.map((period) => (
                    <SelectItem key={period.value} value={period.value}>
                      {period.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <Calendar
            mode="range"
            numberOfMonths={2}
            selected={{
              from: params.from ? new Date(params.from) : undefined,
              to: params.to ? new Date(params.to) : undefined,
            }}
            defaultMonth={
              params.from
                ? new Date(params.from)
                : new Date(new Date().setMonth(new Date().getMonth() - 1))
            }
            initialFocus
            toDate={new Date()}
            onSelect={handleCalendarSelect}
            weekStartsOn={user?.weekStartsOnMonday ? 1 : 0}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
