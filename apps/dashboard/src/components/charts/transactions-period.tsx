"use client";

import { changeTransactionsPeriodAction } from "@/actions/change-transactions-period-action";
import { useI18n } from "@/locales/client";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { useOptimisticAction } from "next-safe-action/hook";

const options = ["all", "income", "expense"];

export function TransactionsPeriod({ type }) {
  const t = useI18n();
  const { execute, optimisticData } = useOptimisticAction(
    changeTransactionsPeriodAction,
    type,
    (_, newState) => {
      return newState;
    },
  );

  return (
    <div className="flex justify-between">
      <div>
        <h2 className="text-2xl">Transactions</h2>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger>
          <div className="flex items-center space-x-2">
            <span>{t(`transactions_period.${optimisticData}`)}</span>
            <Icons.ChevronDown />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[130px]">
          {options.map((option) => (
            <DropdownMenuCheckboxItem
              key={option}
              onCheckedChange={() => execute(option)}
              checked={option === optimisticData}
            >
              {t(`transactions_period.${option}`)}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
