"use client";

import { useI18n } from "@/locales/client";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import Link from "next/link";
import { type TransactionType, options } from "./data";

type Props = {
  type: TransactionType;
  setType: (type: TransactionType) => void;
  disabled: boolean;
};

export function TransactionsPeriod({ type, setType, disabled }: Props) {
  const t = useI18n();

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
            <span>{t(`transactions_period.${type}`)}</span>
            <Icons.ChevronDown />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[130px]">
          {options.map((option) => (
            <DropdownMenuCheckboxItem
              key={option}
              onCheckedChange={() => setType(option)}
              checked={option === type}
            >
              {t(`transactions_period.${option}`)}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
