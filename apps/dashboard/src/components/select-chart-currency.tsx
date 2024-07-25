"use client";

import { changeChartCurrencyAction } from "@/actions/change-chart-currency";
import { cn } from "@midday/ui/cn";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@midday/ui/select";
import { useOptimisticAction } from "next-safe-action/hooks";

type Props = {
  defaultValue?: string;
  className?: string;
  currencies: {
    id: string;
    label: string;
  }[];
};

export function SelectChartCurrency({
  currencies,
  defaultValue,
  className,
}: Props) {
  const { execute, optimisticState } = useOptimisticAction(
    changeChartCurrencyAction,
    {
      currentState: defaultValue,
      updateFn: (_, newState) => newState,
    },
  );

  return (
    <Select
      defaultValue={optimisticState || currencies.at(0)?.id}
      onValueChange={execute}
    >
      <SelectTrigger className={cn("w-[90px] font-medium", className)}>
        <span>{optimisticState}</span>
      </SelectTrigger>
      <SelectContent>
        {currencies.map((currency) => {
          return (
            <SelectItem key={currency.id} value={currency.id}>
              {currency.label}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
