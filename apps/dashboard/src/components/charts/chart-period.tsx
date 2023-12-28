"use client";

import { changeChartPeriodAction } from "@/actions/change-chart-period-action";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { MonthRangePicker } from "@midday/ui/month-range-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { format } from "date-fns";
import { useAction } from "next-safe-action/hook";
import { parseAsString, useQueryStates } from "next-usequerystate";

export function ChartPeriod({ defaultValue, value, disabled }) {
  let placeholder;

  const { execute } = useAction(changeChartPeriodAction);

  const [state, setState] = useQueryStates(
    {
      from: parseAsString.withDefault(value?.from || defaultValue?.from),
      to: parseAsString.withDefault(value?.to || defaultValue?.to),
    },
    {
      shallow: false,
    }
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
      "LLL dd, y"
    )} `;
  }

  const handleChangePeriod = (params) => {
    const range = {
      ...state,
      ...(params.from && { from: params.from }),
      ...(params.to && { to: params.to }),
    };

    execute(range);
    setState(range);
  };

  return (
    <div className="flex space-x-4">
      <Popover>
        <PopoverTrigger asChild disabled={disabled}>
          <Button
            variant="outline"
            className="justify-start text-left font-medium space-x-2"
          >
            <span>{placeholder}</span>
            <Icons.ChevronDown />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[450px] mt-2 pt-1" align="end">
          <MonthRangePicker setDate={handleChangePeriod} date={state} />
        </PopoverContent>
      </Popover>
    </div>
  );
}
