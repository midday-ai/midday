"use client";

import { changeChartPeriodAction } from "@/actions/change-chart-period-action";
import { Button } from "@midday/ui/button";
import { Calendar } from "@midday/ui/calendar";
import { Icons } from "@midday/ui/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { format } from "date-fns";
import { formatISO } from "date-fns";
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
  let placeholder: string;

  const { execute } = useAction(changeChartPeriodAction);

  const [state, setState] = useQueryStates(
    {
      from: parseAsString.withDefault(""),
      to: parseAsString.withDefault(""),
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
    placeholder = `${placeholder} - ${format(
      new Date(state.to),
      "LLL dd, y",
    )} `;
  } else {
    placeholder = `${placeholder} - ${format(
      new Date(defaultValue.to),
      "LLL dd, y",
    )} `;
  }

  const handleChangePeriod = (range) => {
    setState(range);
    execute(range);
  };

  const date = state.from || state.to ? state : defaultValue;

  return (
    <div className="flex space-x-4">
      <Popover>
        <PopoverTrigger asChild disabled={Boolean(disabled)}>
          <Button
            variant="outline"
            className="justify-start text-left font-medium space-x-2"
          >
            <span className="line-clamp-1 text-ellipsis">{placeholder}</span>
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
            today={state.from ? new Date(state.from) : new Date()}
            selected={{
              from: state.from ? new Date(state.from) : undefined,
              to: state.to ? new Date(state.to) : undefined,
            }}
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
