"use client";

import { useI18n } from "@/locales/client";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";

const options = ["revenue", "profit_loss"];

export function ChartSelector() {
  const t = useI18n();

  return (
    <div className="flex space-x-2 items-center mb-2">
      <DropdownMenu>
        <DropdownMenuTrigger>
          <div className="flex items-center space-x-2">
            <h2 className="text-md">Revenue</h2>
            <Icons.ChevronDown />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-46">
          {options.map((option) => (
            <DropdownMenuCheckboxItem
              key={option}
              // onCheckedChange={() => execute(option)}
              // checked={option.id === optimisticData?.id}
            >
              {t(`chart_selector.${option}`)}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
