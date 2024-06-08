"use client";

import { TransactionListItem } from "@/components/charts/transaction-list-item";
import { useMeasure } from "@uidotdev/usehooks";

const PADDING = 105;

export function TransactionsItemList({ transactions, disabled }) {
  const [ref, { width }] = useMeasure();

  return (
    <div ref={ref}>
      <ul
        className="bullet-none divide-y cursor-pointer overflow-auto scrollbar-hide"
        style={{ maxHeight: width - PADDING }}
      >
        {transactions?.map((transaction) => {
          return (
            <li key={transaction.id}>
              <TransactionListItem
                transaction={transaction}
                disabled={disabled}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
