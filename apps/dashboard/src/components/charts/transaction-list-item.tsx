"use client";

import { TransactionSheet } from "@/components/sheets/transaction-sheet";
import { Icons } from "@midday/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { cn } from "@midday/ui/utils";
import { useState } from "react";
import { FormatAmount } from "../format-amount";

function TransactionStatus({ fullfilled }) {
  if (fullfilled) {
    return <Icons.Check />;
  }

  return (
    <TooltipProvider delayDuration={50}>
      <Tooltip>
        <TooltipTrigger>
          <Icons.AlertCircle />
        </TooltipTrigger>
        <TooltipContent className="px-3 py-1.5 text-xs" sideOffset={5}>
          Missing attachment
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function TransactionListItem({ transaction, disabled }) {
  const [isOpen, setOpen] = useState();

  const fullfilled = transaction?.attachments?.length > 0;

  return (
    <>
      <div className="flex p-3" onClick={() => setOpen(true)}>
        <div className="w-[50%] flex space-x-2">
          <span
            className={cn(
              "text-sm",
              disabled && "skeleton-box",
              transaction?.category === "income" && "text-[#00C969]"
            )}
          >
            {transaction.name}
          </span>
        </div>
        <div className="w-[35%]">
          <span
            className={cn(
              "text-sm",
              disabled && "skeleton-box",
              transaction?.category === "income" && "text-[#00C969]"
            )}
          >
            <FormatAmount
              amount={transaction.amount}
              currency={transaction.currency}
            />
          </span>
        </div>

        <div className="ml-auto">
          <TransactionStatus fullfilled={fullfilled} />
        </div>
      </div>

      <TransactionSheet
        isOpen={isOpen}
        setOpen={setOpen}
        data={transaction}
        transactionId={transaction.id}
      />
    </>
  );
}
