"use client";

import { deleteBankAccountAction } from "@/actions/delete-bank-account-action";
import { Avatar, AvatarImage } from "@midday/ui/avatar";
import { Button } from "@midday/ui/button";
import { formatDistanceToNow } from "date-fns";
import { useAction } from "next-safe-action/hooks";

export function BankAccount({ id, name, bank_name, logo, last_accessed }) {
  const action = useAction(deleteBankAccountAction);

  return (
    <div className="flex justify-between pt-6 items-center">
      <div className="flex items-center">
        <Avatar className="flex h-9 w-9 items-center justify-center space-y-0 border">
          <AvatarImage src={logo} alt={name} />
        </Avatar>
        <div className="ml-4 flex flex-col">
          <p className="text-sm font-medium leading-none mb-1">{name}</p>
          <span className="text-xs font-medium text-[#606060]">
            {bank_name}
          </span>
          <span className="text-xs text-[#606060]">
            Last accessed {formatDistanceToNow(new Date(last_accessed))} ago
          </span>
        </div>
      </div>

      <div className="flex space-x-2">
        <Button variant="outline" onClick={() => action.execute({ id })}>
          Remove
        </Button>
      </div>
    </div>
  );
}
