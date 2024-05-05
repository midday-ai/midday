"use client";

import { TransactionSheet } from "@/components/sheets/transaction-sheet";
import { cn } from "@midday/ui/cn";
import { useState } from "react";
import { FormatAmount } from "../format-amount";
import { TransactionStatus } from "../transaction-status";

type Props = {
  transaction: any;
  disabled?: boolean;
};

export function TransactionListItem({ transaction, disabled }: Props) {
  const [isOpen, setOpen] = useState(false);

  const fullfilled =
    transaction?.status === "completed" || transaction?.attachments?.length > 0;

  return (
    <>
      <div onClick={() => setOpen(true)} className="w-full">
        <div className="flex items-center p-3">
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
      </div>

      <TransactionSheet isOpen={isOpen} setOpen={setOpen} data={transaction} />
    </>
  );
}
