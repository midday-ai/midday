"use client";

import { changeChartTypeAction } from "@/actions/change-chart-type-action";
import { useI18n } from "@/locales/client";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@midday/ui/select";
import { useOptimisticAction } from "next-safe-action/hooks";

const options = ["profit", "revenue", "expense", "burn_rate"];

type Props = {
  initialValue: string;
  disabled?: boolean;
};

export function ChartType({ initialValue, disabled }: Props) {
  const t = useI18n();
  const { execute, optimisticState } = useOptimisticAction(
    changeChartTypeAction,
    {
      currentState: initialValue,
      updateFn: (_, newState) => newState,
    },
  );

  return (
    <Select defaultValue={optimisticState} onValueChange={execute}>
      <SelectTrigger
        className="flex-1 space-x-1 font-medium"
        disabled={disabled}
      >
        <span>{t(`chart_type.${optimisticState}`)}</span>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.map((option) => {
            return (
              <SelectItem key={option} value={option}>
                {t(`chart_type.${option}`)}
              </SelectItem>
            );
          })}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
