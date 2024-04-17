"use client";

import { changeChartTypeAction } from "@/actions/change-chart-type-action";
import { useI18n } from "@/locales/client";
import { Icons } from "@midday/ui/icons";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@midday/ui/select";
import { useOptimisticAction } from "next-safe-action/hooks";

const options = ["profit", "revenue", "burn-rate"];

type Props = {
  initialValue: string;
  disabled?: boolean;
};

export function ChartType({ initialValue, disabled }: Props) {
  const t = useI18n();
  const { execute, optimisticData } = useOptimisticAction(
    changeChartTypeAction,
    initialValue,
    (_, newState) => {
      return newState;
    }
  );

  return (
    <Select defaultValue={optimisticData} onValueChange={execute}>
      <SelectTrigger
        className="flex-1 space-x-1 font-medium"
        disabled={disabled}
      >
        <span>{t(`chart_type.${optimisticData}`)}</span>
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
