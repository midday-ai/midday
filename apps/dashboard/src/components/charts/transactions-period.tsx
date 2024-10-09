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
import { useOptimisticAction } from "next-safe-action/hooks";
import Link from "next/link";

const options = ["all", "income", "expense"] as const;
type TransactionType = (typeof options)[number];

type Props = {
  type: "all" | "income" | "expense";
  disabled: boolean;
};

export function TransactionsPeriod({ type, disabled }: Props) {
  const t = useI18n();
  const { execute, optimisticState } = useOptimisticAction(
    changeTransactionsPeriodAction,
    {
      currentState: type,
      updateFn: (_, newState) => newState,
    },
  );

  return (
    <div className="flex justify-between">
      <div>
        <Link href="/transactions" prefetch>
          <h2 className="text-lg">Transactions</h2>
        </Link>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger disabled={disabled}>
          <div className="flex items-center space-x-2">
            <span>{t(`transactions_period.${optimisticState}`)}</span>
            <Icons.ChevronDown />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[130px]">
          {options.map((option) => (
            <DropdownMenuCheckboxItem
              key={option}
              onCheckedChange={() => execute(option as TransactionType)}
              checked={option === optimisticState}
            >
              {t(`transactions_period.${option}`)}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
