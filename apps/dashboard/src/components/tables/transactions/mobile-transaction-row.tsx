"use client";

import type { RouterOutputs } from "@api/trpc/routers/_app";
import { cn } from "@midday/ui/cn";
import { formatDate } from "@midday/utils/format";
import { FormatAmount } from "@/components/format-amount";
import { TransactionStatus } from "@/components/transaction-status";
import { useTransactionParams } from "@/hooks/use-transaction-params";
import { useUserQuery } from "@/hooks/use-user";

type Transaction =
  RouterOutputs["transactions"]["get"]["data"][number];

type Props = {
  transaction: Transaction;
  virtualStart: number;
  isSelected?: boolean;
};

export function MobileTransactionRow({
  transaction,
  virtualStart,
  isSelected,
}: Props) {
  const { setParams } = useTransactionParams();
  const { data: user } = useUserQuery();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setParams({ transactionId: transaction.id })}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setParams({ transactionId: transaction.id });
        }
      }}
      className={cn(
        "absolute left-0 right-0 flex flex-col gap-1 px-4 py-3 border-b border-border cursor-pointer",
        "hover:bg-[#F2F1EF] hover:dark:bg-[#0f0f0f]",
        isSelected && "bg-[#F2F1EF] dark:bg-[#0f0f0f]",
      )}
      style={{
        transform: `translateY(${virtualStart}px)`,
        contain: "layout style paint",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "text-sm font-medium line-clamp-2 flex-1 min-w-0",
            transaction.amount > 0 && "text-[#00C969]",
          )}
        >
          {transaction.name}
        </span>
        <span
          className={cn(
            "text-sm shrink-0",
            transaction.amount > 0 && "text-[#00C969]",
          )}
        >
          <FormatAmount
            amount={transaction.amount}
            currency={transaction.currency}
          />
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {formatDate(transaction.date, user?.dateFormat)}
          {transaction.category?.name && (
            <span className="ml-2">· {transaction.category.name}</span>
          )}
        </span>
        <TransactionStatus
          isFulfilled={transaction.isFulfilled ?? false}
          isExported={transaction.isExported ?? false}
          hasExportError={transaction.hasExportError}
          exportErrorCode={transaction.exportErrorCode}
          exportProvider={transaction.exportProvider}
          exportedAt={transaction.exportedAt}
          hasPendingSuggestion={transaction.hasPendingSuggestion}
        />
      </div>
    </div>
  );
}
