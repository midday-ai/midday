"use client";

import { changeChartCurrencyAction } from "@/actions/change-chart-currency";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@midday/ui/select";
import { useOptimisticAction } from "next-safe-action/hooks";

type Props = {
  defaultValue?: string;
  currencies: {
    id: string;
    label: string;
  }[];
};

export function SelectCurrency({ currencies, defaultValue }: Props) {
  const { execute, optimisticData } = useOptimisticAction(
    changeChartCurrencyAction,
    defaultValue,
    (_, newState) => {
      return newState;
    }
  );

  return (
    <Select
      defaultValue={optimisticData || currencies.at(0)?.id}
      onValueChange={execute}
    >
      <SelectTrigger className="w-[90px] font-medium">
        <span>{optimisticData}</span>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {currencies.map((currency) => {
            return (
              <SelectItem key={currency.id} value={currency.id}>
                {currency.label}
              </SelectItem>
            );
          })}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
