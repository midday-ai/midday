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

const options = ["all", "completed"];

export function InboxHeader({ filter, disabled }) {
  const t = useI18n();
  const { execute, optimisticData } = useOptimisticAction(
    changeInboxFilterAction,
    filter,
    (_, newState) => {
      return newState;
    }
  );

  return (
    <div className="flex justify-between">
      <div>
        <h2 className="text-lg">Inbox</h2>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger disabled={disabled}>
          <div className="flex items-center space-x-2">
            <span>{t(`inbox_filter.${optimisticData}`)}</span>
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
              {t(`inbox_filter.${option}`)}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
