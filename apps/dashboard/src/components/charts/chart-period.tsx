"use client";

import { changeChartPeriodAction } from "@/actions/change-chart-period-action";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { MonthRangePicker } from "@midday/ui/month-range-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { format } from "date-fns";
import { useAction } from "next-safe-action/hooks";
import { parseAsString, useQueryStates } from "nuqs";

export function ChartPeriod({ defaultValue, disabled }) {
  let placeholder;

  const { execute } = useAction(changeChartPeriodAction);

  const [state, setState] = useQueryStates(
    {
      from: parseAsString.withDefault(""),
      to: parseAsString.withDefault(""),
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
    placeholder = `${placeholder} - ${format(
      new Date(state.to),
      "LLL dd, y"
    )} `;
  } else {
    placeholder = `${placeholder} - ${format(
      new Date(defaultValue.to),
      "LLL dd, y"
    )} `;
  }

  const handleChangePeriod = (params) => {
    const prevRange = state;

    if (params.from || params.to) {
      const range = {
        ...prevRange,
        ...params,
      };

      setState(range);
      execute(range);
    } else {
      setState({
        from: "",
        to: "",
      });
    }
  };

  const date = state.from || state.to ? state : defaultValue;

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
          <MonthRangePicker setDate={handleChangePeriod} date={date} />
        </PopoverContent>
      </Popover>
    </div>
  );
}
