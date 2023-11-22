import { formatAmount } from "@/utils/format";
import { getTransactions } from "@midday/supabase/cached-queries";
import { Icons } from "@midday/ui/icons";
import { Skeleton } from "@midday/ui/skeleton";
import { cn } from "@midday/ui/utils";
import Link from "next/link";
import { Tag } from "../tag";
import { transactionList } from "./data";

export function TransactionsListHeader() {
  return (
    <div className="flex  p-3 border-b-[1px]">
      <span className="font-medium text-sm w-[50%]">Description</span>
      <span className="font-medium text-sm w-[35%]">Amount</span>
      <span className="font-medium text-sm">Status</span>
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

export async function TransactionsList({ type, disabled }) {
  const { data } = disabled
    ? transactionList
    : await getTransactions({
        to: 5,
        from: 0,
        filter: {
          type,
        },
      });

  return (
    <ul className="bullet-none divide-y">
      {data?.map((transaction) => {
        const fullfilled = transaction?.attachments?.length > 0;

        return (
          <li key={transaction.id}>
            <Link
              href={`/transactions?id=${transaction.id}`}
              className="flex p-3"
            >
              <div className="w-[50%]">
                <span
                  className={cn(
                    "text-sm",
                    disabled && "skeleton-box",
                    transaction?.amount > 0 && "text-[#00C969]"
                  )}
                >
                  <div className="flex space-x-4 items-center">
                    <span>{transaction.name}</span>
                    {transaction?.pending && <Tag type="pending" />}
                  </div>
                </span>
              </div>
              <div className="w-[35%]">
                <span
                  className={cn(
                    "text-sm",
                    disabled && "skeleton-box",
                    transaction?.amount > 0 && "text-[#00C969]"
                  )}
                >
                  {formatAmount({
                    locale: "en",
                    amount: transaction.amount,
                    currency: transaction.currency,
                  })}
                </span>
              </div>

              {fullfilled ? <Icons.Check /> : <Icons.AlertCircle />}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
