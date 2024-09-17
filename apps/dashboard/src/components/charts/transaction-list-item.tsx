"use client";

import type { UpdateTransactionValues } from "@/actions/schema";
import { updateTransactionAction } from "@/actions/update-transaction-action";
import { TransactionSheet } from "@/components/sheets/transaction-sheet";
import { cn } from "@midday/ui/cn";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { FormatAmount } from "../format-amount";
import { TransactionStatus } from "../transaction-status";

type Props = {
  transaction: any;
  disabled?: boolean;
};

export function TransactionListItem({ transaction, disabled }: Props) {
  const [isOpen, setOpen] = useState(false);
  const updateTransaction = useAction(updateTransactionAction);

  const handleUpdateTransaction = (values: UpdateTransactionValues) => {
    updateTransaction.execute(values);
  };

  const fullfilled =
    transaction?.status === "completed" || transaction?.attachments?.length > 0;

  return (
    <>
      <div onClick={() => setOpen(true)} className="w-full">
        <div className="flex items-center py-3">
          <div className="w-[50%] flex space-x-2">
            <span
              className={cn(
                "text-sm line-clamp-1",
                disabled && "skeleton-box animate-none",
                transaction?.category?.slug === "income" && "text-[#00C969]",
              )}
            >
              {transaction.name}
            </span>
          </div>
          <div className="w-[35%]">
            <span
              className={cn(
                "text-sm line-clamp-1",
                disabled && "skeleton-box animate-none",
                transaction?.category?.slug === "income" && "text-[#00C969]",
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

      <TransactionSheet
        isOpen={isOpen}
        setOpen={setOpen}
        data={transaction}
        updateTransaction={handleUpdateTransaction}
      />
    </>
  );
}
