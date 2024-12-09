"use client";

import { changeChartPeriodAction } from "@/actions/change-chart-period-action";
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
import { startOfMonth, startOfYear, subMonths, subWeeks } from "date-fns";
import { formatDateRange } from "little-date";
import { useAction } from "next-safe-action/hooks";
import { parseAsString, useQueryStates } from "nuqs";

type Props = {
  defaultValue: {
    to: string;
    from: string;
  };
  disabled?: string;
};

const periods = [
  {
    value: "4w",
    label: "Last 4 weeks",
    range: {
      from: subWeeks(new Date(), 4),
      to: new Date(),
    },
  },
  {
    value: "3m",
    label: "Last 3 months",
    range: {
      from: subMonths(new Date(), 3),
      to: new Date(),
    },
  },
  {
    value: "6m",
    label: "Last 6 months",
    range: {
      from: subMonths(new Date(), 6),
      to: new Date(),
    },
  },
  {
    value: "12m",
    label: "Last 12 months",
    range: {
      from: subMonths(new Date(), 12),
      to: new Date(),
    },
  },
  {
    value: "mtd",
    label: "Month to date",
    range: {
      from: startOfMonth(new Date()),
      to: new Date(),
    },
  },
  {
    value: "ytd",
    label: "Year to date",
    range: {
      from: startOfYear(new Date()),
      to: new Date(),
    },
  },
  {
    value: "all",
    label: "All time",
    range: {
      // Can't get older data than this
      from: new Date("2020-01-01"),
      to: new Date(),
    },
  },
];
export function ChartPeriod({ defaultValue, disabled }: Props) {
  const { execute } = useAction(changeChartPeriodAction);

  const [params, setParams] = useQueryStates(
    {
      from: parseAsString.withDefault(defaultValue.from),
      to: parseAsString.withDefault(defaultValue.to),
      period: parseAsString,
    },
    {
      shallow: false,
    },
  );

  const handleChangePeriod = (
    range: { from: Date | null; to: Date | null } | undefined,
    period?: string,
  ) => {
    if (!range) return;

    const newRange = {
      from: range.from
        ? formatISO(range.from, { representation: "date" })
        : params.from,
      to: range.to
        ? formatISO(range.to, { representation: "date" })
        : params.to,
      period,
    };

    setParams(newRange);
    execute(newRange);
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
              {formatDateRange(new Date(params.from), new Date(params.to), {
                includeTime: false,
              })}
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
              defaultValue={params.period ?? undefined}
              onValueChange={(value) =>
                handleChangePeriod(
                  periods.find((p) => p.value === value)?.range,
                  value,
                )
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a period" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {periods.map((period) => (
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
              from: params.from && new Date(params.from),
              to: params.to && new Date(params.to),
            }}
            defaultMonth={
              new Date(new Date().setMonth(new Date().getMonth() - 1))
            }
            initialFocus
            toDate={new Date()}
            onSelect={(date) => handleChangePeriod(date)}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
