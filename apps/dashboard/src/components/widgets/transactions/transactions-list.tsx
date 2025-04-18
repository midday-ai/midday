"use client";

import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { TransactionType } from "./data";
import { TransactionsItemList } from "./transactions-item-list";

type Props = {
  type: TransactionType;
  disabled: boolean;
};

export function TransactionsList({ type, disabled }: Props) {
  const trpc = useTRPC();

  const { data: transactions } = useSuspenseQuery(
    trpc.transactions.get.queryOptions({
      pageSize: 15,
      filter: {
        type: type === "all" ? undefined : type,
      },
    }),
  );

  if (!transactions?.data?.length) {
    return (
      <div className="flex items-center justify-center aspect-square">
        <p className="text-sm text-[#606060] -mt-12">No transactions found</p>
      </div>
    );
  }

  return (
    <TransactionsItemList
      transactions={transactions?.data}
      disabled={disabled}
    />
  );
}
