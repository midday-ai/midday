"use client";

import { updateBankAccountAction } from "@/actions/update-bank-account-action";
import { Avatar, AvatarFallback } from "@midday/ui/avatar";
import { cn } from "@midday/ui/cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Switch } from "@midday/ui/switch";
import { MoreHorizontal } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { FormatAmount } from "./format-amount";

type Props = {
  id: string;
  name: string;
  balance: number;
  currency: string;
  enabled: boolean;
  manual: boolean;
  type: string;
};

export function BankAccount({
  id,
  name,
  currency,
  balance,
  enabled,
  manual,
  type,
}: Props) {
  const updateAccount = useAction(updateBankAccountAction);

  const getInitials = () => {
    const formatted = name.toUpperCase();

    if (formatted.split(" ").length > 1) {
      return `${formatted.charAt(0)}${formatted.charAt(1)}`;
    }

    return formatted.charAt(0);
  };

  return (
    <div
      className={cn(
        "flex justify-between items-center mb-4 pt-4",
        !enabled && "opacity-60",
      )}
    >
      <div className="flex items-center space-x-4 w-full mr-8">
        <Avatar className="size-[34px]">
          <AvatarFallback className="text-[11px]">
            {getInitials()}
          </AvatarFallback>
        </Avatar>

        <div className="flex items-center justify-between w-full">
          <div className="flex flex-col">
            <p className="font-medium leading-none mb-1 text-sm">
              {name} ({currency})
            </p>
            <span className="text-xs text-[#878787] font-normal">
              {type === "depository" ? "Depository" : "Credit"}
            </span>
          </div>

          <span className="text-[#878787] text-sm">
            <FormatAmount amount={balance} currency={currency} />
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <MoreHorizontal size={20} />
          </DropdownMenuTrigger>
          {enabled && (
            <DropdownMenuContent className="w-48">
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Import</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Remove</DropdownMenuItem>
            </DropdownMenuContent>
          )}
        </DropdownMenu>

        {!manual && (
          <Switch
            checked={enabled}
            disabled={updateAccount.status === "executing"}
            onCheckedChange={(enabled: boolean) => {
              updateAccount.execute({ id, enabled });
            }}
          />
        )}
      </div>
    </div>
  );
}
