import { formatAmount } from "@/utils/format";
import { getCachedTransactions } from "@midday/supabase/cached-queries";
import { Skeleton } from "@midday/ui/skeleton";
import { cn } from "@midday/ui/utils";

export function TransactionsListHeader() {
  return (
    <div className="flex justify-between p-3 border-b-[1px]">
      <span className="font-medium text-sm">Description</span>
      <span className="font-medium text-sm w-[40%]">Amount</span>
    </div>
  );
}

export function TransactionsListSkeleton() {
  return (
    <div className="divide-y">
      {[...Array(6)].map((_, index) => (
        <div
          key={index.toString()}
          className="flex justify-between px-3 items-center h-[44px]"
        >
          <div className="w-[60%]">
            <Skeleton className="h-4 w-[50%]" />
          </div>
          <div className="w-[40%]">
            <Skeleton className="w-[60%] h-4 align-start" />
          </div>
        </div>
      ))}
    </div>
  );
}

export async function TransactionsList() {
  const { data } = await getCachedTransactions({
    to: 5,
    from: 0,
  });

  return (
    <ul className="bullet-none divide-y">
      {data?.map((transaction) => (
        <li key={transaction.id} className="flex justify-between p-3">
          <span
            className={cn(
              "text-sm",
              transaction?.amount > 0 && "text-[#00C969]",
            )}
          >
            {transaction.name}
          </span>
          <span
            className={cn(
              "w-[40%] text-sm",
              transaction?.amount > 0 && "text-[#00C969]",
            )}
          >
            {formatAmount({
              locale: "en",
              amount: transaction.amount,
              currency: transaction.currency,
            })}
          </span>
        </li>
      ))}
    </ul>
  );
}
