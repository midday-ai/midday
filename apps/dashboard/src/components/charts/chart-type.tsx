"use client";

import { changeChartTypeAction } from "@/actions/change-chart-type-action";
import { useI18n } from "@/locales/client";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { useOptimisticAction } from "next-safe-action/hook";

const options = ["profit_loss", "income"];

export function ChartType({ initialValue, disabled }) {
  const t = useI18n();
  const { execute, optimisticData } = useOptimisticAction(
    changeChartTypeAction,
    initialValue,
    (_, newState) => {
      return newState;
    },
  );

  return (
    <div className="flex space-x-2 items-center mb-2">
      <DropdownMenu>
        <DropdownMenuTrigger disabled={disabled}>
          <div className="flex items-center space-x-2">
            <h2 className="text-md">{t(`chart_type.${optimisticData}`)}</h2>
            <Icons.ChevronDown />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-46">
          {options.map((option) => (
            <DropdownMenuCheckboxItem
              key={option}
              onCheckedChange={() => execute(option)}
              checked={option === optimisticData}
            >
              {t(`chart_type.${option}`)}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
