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
  subDays,
  subMonths,
  subYears,
} from "date-fns";
import { useOptimisticAction } from "next-safe-action/hooks";
import Link from "next/link";

const options = [
  {
    id: "last_30d",
    from: subDays(new Date(), 30).toISOString(),
    to: new Date().toISOString(),
  },
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

type Props = {
  initialPeriod: { id: string; from: string; to: string };
};

export function SpendingPeriod({ initialPeriod }: Props) {
  const t = useI18n();
  const { execute, optimisticState } = useOptimisticAction(
    changeSpendingPeriodAction,
    {
      currentState: initialPeriod,
      updateFn: (_, newState) => newState,
    },
  );

  return (
    <div className="flex justify-between">
      <div>
        <Link
          href={`/transactions?start=${optimisticState.from}&end=${optimisticState.to}&amount=lte,0`}
          prefetch
        >
          <h2 className="text-lg">Spending</h2>
        </Link>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger>
          <div className="flex items-center space-x-2">
            <span>{t(`spending_period.${optimisticState.id}`)}</span>
            <Icons.ChevronDown />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[180px]">
          {options.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.id}
              onCheckedChange={() => execute(option)}
              checked={option.id === optimisticState?.id}
            >
              {t(`spending_period.${option.id}`)}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
