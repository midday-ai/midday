"use client";

import { changeChartPeriodAction } from "@/actions/change-chart-period-action";
import { Button } from "@midday/ui/button";
import { Calendar } from "@midday/ui/calendar";
import { Icons } from "@midday/ui/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { formatISO } from "date-fns";
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

export function ChartPeriod({ defaultValue, disabled }: Props) {
  const { execute } = useAction(changeChartPeriodAction);

  const [params, setParams] = useQueryStates(
    {
      from: parseAsString.withDefault(defaultValue.from),
      to: parseAsString.withDefault(defaultValue.to),
    },
    {
      shallow: false,
    },
  );

  const handleChangePeriod = (range) => {
    setParams(range);
    execute(range);
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
          className="w-screen md:w-[550px] p-0"
          align="end"
          sideOffset={10}
        >
          <Calendar
            mode="range"
            numberOfMonths={2}
            today={params.from ? new Date(params.from) : new Date()}
            selected={{
              from: params.from && new Date(params.from),
              to: params.to && new Date(params.to),
            }}
            defaultMonth={
              new Date(new Date().setMonth(new Date().getMonth() - 1))
            }
            initialFocus
            toDate={new Date()}
            onSelect={({ from, to }) => {
              handleChangePeriod({
                from: from ? formatISO(from, { representation: "date" }) : null,
                to: to ? formatISO(to, { representation: "date" }) : null,
              });
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
