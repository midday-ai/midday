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
import { type InboxOption, options } from "./data";

type Props = {
  filter: InboxOption;
  disabled: boolean;
  setFilter: (filter: InboxOption) => void;
};

export function InboxHeader({ filter, disabled, setFilter }: Props) {
  const t = useI18n();

  return (
    <div className="flex justify-between">
      <div>
        <Link href="/inbox" prefetch>
          <h2 className="text-lg">Inbox</h2>
        </Link>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger disabled={disabled}>
          <div className="flex items-center space-x-2">
            <span>{t(`inbox_filter.${filter}`)}</span>
            <Icons.ChevronDown />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[130px]">
          {options.map((option) => (
            <DropdownMenuCheckboxItem
              key={option}
              onCheckedChange={() => setFilter(option)}
              checked={option === filter}
            >
              {t(`inbox_filter.${option}`)}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
