"use client";

import { changeSpendingPeriodAction } from "@/actions/change-spending-period-action";
import { useI18n } from "@/locales/client";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import {
  endOfMonth,
  startOfMonth,
  startOfYear,
  subMonths,
  subYears,
} from "date-fns";
import { useOptimisticAction } from "next-safe-action/hook";

const options = [
  {
    id: "this_month",
    from: startOfMonth(new Date()).toISOString(),
    to: new Date().toISOString(),
  },
  {
    id: "last_month",
    from: subMonths(startOfMonth(new Date()), 1).toISOString(),
    to: subMonths(endOfMonth(new Date()), 1).toISOString(),
  },
  {
    id: "this_year",
    from: startOfYear(new Date()).toISOString(),
    to: new Date().toISOString(),
  },
  {
    id: "last_year",
    from: subYears(startOfMonth(new Date()), 1).toISOString(),
    to: subYears(endOfMonth(new Date()), 1).toISOString(),
  },
];

export function SpendingPeriod({ initialPeriod }) {
  const t = useI18n();
  const { execute, optimisticData } = useOptimisticAction(
    changeSpendingPeriodAction,
    initialPeriod,
    (_, newState) => {
      return newState;
    },
  );

  return (
    <div className="flex justify-between">
      <div>
        <h2 className="text-2xl">Spending</h2>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger>
          <div className="flex items-center space-x-2">
            <span>{t(`spending_period.${optimisticData.id}`)}</span>
            <Icons.ChevronDown />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[150px]">
          {options.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.id}
              onCheckedChange={() => execute(option)}
              checked={option.id === optimisticData?.id}
            >
              {t(`spending_period.${option.id}`)}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
