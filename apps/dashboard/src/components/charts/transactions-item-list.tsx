import { TransactionListItem } from "@/components/charts/transaction-list-item";

export function TransactionsItemList({ transactions, disabled }) {
  return (
    <ul className="bullet-none divide-y cursor-pointer overflow-auto scrollbar-hide aspect-square pb-24">
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
  );
}
