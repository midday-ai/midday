import { getTransactions } from "@midday/supabase/cached-queries";
import { Skeleton } from "@midday/ui/skeleton";
import { transactionExampleData } from "./data";
import { TransactionsItemList } from "./transactions-item-list";

export function TransactionsListHeader() {
  return (
    <div className="flex py-3 border-b-[1px]">
      <span className="font-medium text-sm w-[50%]">Description</span>
      <span className="font-medium text-sm w-[35%]">Amount</span>
      <span className="font-medium text-sm ml-auto">Status</span>
    </div>
  );
}

export function TransactionsListSkeleton() {
  return (
    <div className="divide-y">
      {[...Array(6)].map((_, index) => (
        <div
          key={index.toString()}
          className="flex justify-between px-3 items-center h-[49px]"
        >
          <div className="w-[60%]">
            <Skeleton className="h-3 w-[50%]" />
          </div>
          <div className="w-[40%] ml-auto">
            <Skeleton className="w-[60%] h-3 align-start" />
          </div>
        </div>
      ))}
    </div>
  );
}

type Props = {
  type: string;
  disabled: boolean;
};

export async function TransactionsList({ type, disabled }: Props) {
  const transactions = disabled
    ? transactionExampleData
    : await getTransactions({
        to: 15,
        from: 0,
        filter: {
          type,
        },
      });

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
