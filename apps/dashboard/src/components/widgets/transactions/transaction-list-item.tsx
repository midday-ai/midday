"use client";

import { FormatAmount } from "@/components/format-amount";
import { TransactionStatus } from "@/components/transaction-status";
import { useTransactionParams } from "@/hooks/use-transaction-params";
import type { RouterOutputs } from "@api/trpc/routers/_app";
import { cn } from "@midday/ui/cn";

type Props = {
  transaction: NonNullable<
    RouterOutputs["transactions"]["get"]["data"]
  >[number];
  disabled?: boolean;
};

export function TransactionListItem({ transaction, disabled }: Props) {
  const { setParams } = useTransactionParams();
  const fullfilled =
    transaction?.status === "completed" || transaction?.attachments?.length > 0;

  return (
    <>
      <div
        onClick={() => setParams({ transactionId: transaction.id })}
        className="w-full"
      >
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
    </>
  );
}
