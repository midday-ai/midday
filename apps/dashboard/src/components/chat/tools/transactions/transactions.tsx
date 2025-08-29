"use client";

import { BotMessage } from "@/components/chat/messages";
import { FormatAmount } from "@/components/format-amount";
import { TransactionStatus } from "@/components/transaction-status";
import { useUserQuery } from "@/hooks/use-user";
import type { GetTransactionsResult } from "@/lib/tools/get-transactions";
import { useTRPC } from "@/trpc/client";
import { formatDate } from "@/utils/format";
import { cn } from "@midday/ui/cn";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";
import { useQuery } from "@tanstack/react-query";
import { ShowMoreButton } from "./show-more-buttont";
import { TransactionsSkeleton } from "./skeleton";

type Props = {
  result: GetTransactionsResult;
};

export function Transactions({ result }: Props) {
  const trpc = useTRPC();
  const { data: user } = useUserQuery();
  const { pageSize, sort, ...filter } = result.params;

  const { data, isLoading } = useQuery(
    trpc.transactions.get.queryOptions({
      sort,
      pageSize,
      ...filter,
    }),
  );

  if (isLoading) {
    return (
      <BotMessage>
        <TransactionsSkeleton />
      </BotMessage>
    );
  }

  return (
    <BotMessage className="text-xs font-sans mb-8">
      <Table className="text-xs font-sans w-[640px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[45%] h-10">Description</TableHead>
            <TableHead className="h-10 min-w-[80px]">Date</TableHead>
            <TableHead className="h-10">Amount</TableHead>
            <TableHead className="h-10 text-right w-[50px]">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.data?.map((transaction) => {
            const fullfilled = transaction.isFulfilled;

            return (
              <TableRow key={transaction.id} className="h-[34px]">
                <TableCell
                  className={cn(
                    "font-normal",
                    transaction.category?.slug === "income" && "text-[#00C969]",
                  )}
                >
                  <span className="line-clamp-1">{transaction.name}</span>
                </TableCell>
                <TableCell className="font-normal">
                  {formatDate(transaction.date, user?.dateFormat)}
                </TableCell>
                <TableCell
                  className={cn(
                    "font-normal",
                    transaction.category?.slug === "income" && "text-[#00C969]",
                  )}
                >
                  <FormatAmount
                    amount={transaction.amount}
                    currency={transaction.currency}
                  />
                </TableCell>
                <TableCell className="text-right font-normal">
                  <TransactionStatus
                    fullfilled={fullfilled}
                    hasPendingSuggestion={transaction.hasPendingSuggestion}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {result.meta.hasNextPage && <ShowMoreButton params={result.params} />}
    </BotMessage>
  );
}
