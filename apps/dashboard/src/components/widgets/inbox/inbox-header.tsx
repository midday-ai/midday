"use client";

import { changeInboxFilterAction } from "@/actions/inbox/filter";
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

const options = ["all", "todo", "done"];

type Props = {
  filter: string;
  disabled: boolean;
};

export function InboxHeader({ filter, disabled }: Props) {
  const t = useI18n();
  const { execute, optimisticState } = useOptimisticAction(
    changeInboxFilterAction,
    {
      currentState: filter,
      updateFn: (_, newState) => newState,
    },
  );

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
            <span>{t(`inbox_filter.${optimisticState}`)}</span>
            <Icons.ChevronDown />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[130px]">
          {options.map((option) => (
            <DropdownMenuCheckboxItem
              key={option}
              onCheckedChange={() => execute(option)}
              checked={option === optimisticState}
            >
              {t(`inbox_filter.${option}`)}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
