"use client";

import { FormatAmount } from "@/components/format-amount";
import { TransactionTypeBadge } from "@/components/transaction-type-badge";
import { useTRPC } from "@/trpc/client";
import { TZDate } from "@date-fns/tz";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

type BankConnection = {
  name: string | null;
  logoUrl: string | null;
  lastAccessed: Date | null;
};

type Account = {
  id: string;
  name: string | null;
  balance: string | null;
  currency: string | null;
  type: string | null;
  manual: boolean | null;
  bankConnection: BankConnection | null;
};

type Props = {
  accountId: string;
  account: Account;
};

export function AccountDetailContent({ accountId, account }: Props) {
  const trpc = useTRPC();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSuspenseInfiniteQuery(
      trpc.transactions.get.infiniteQueryOptions(
        {
          accounts: [accountId],
          sort: ["date", "desc"],
        },
        {
          getNextPageParam: ({ meta }) => meta?.cursor,
        },
      ),
    );

  const transactions = data?.pages.flatMap((page) => page.data) ?? [];
  const balance = Number(account.balance ?? 0);
  const currency = account.currency ?? "USD";
  const lastSynced = account.bankConnection?.lastAccessed;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/accounts"
          className="inline-flex items-center gap-1 text-sm text-[#606060] hover:text-primary transition-colors mb-4"
        >
          <Icons.ArrowLeft className="size-4" />
          Back to Accounts
        </Link>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {account.bankConnection?.logoUrl ? (
              <img
                src={account.bankConnection.logoUrl}
                alt=""
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Icons.Accounts size={20} />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-serif tracking-tight">
                {account.name ?? "Unnamed Account"}
              </h1>
              <p className="text-sm text-[#606060]">
                {account.bankConnection?.name ??
                  (account.manual ? "Manual Account" : "")}
                {lastSynced && (
                  <>
                    {" \u00b7 "}
                    Synced{" "}
                    {formatDistanceToNow(new Date(lastSynced), {
                      addSuffix: true,
                    })}
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p
              className={cn(
                "text-2xl font-mono font-medium",
                balance > 0 && "text-[#00C969]",
              )}
            >
              <FormatAmount amount={balance} currency={currency} />
            </p>
            <p className="text-sm text-[#606060]">{currency}</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-background border border-border px-4 py-3">
          <div className="text-[12px] text-[#606060] mb-2">Balance</div>
          <div className="text-[18px] font-medium font-mono">
            <FormatAmount amount={balance} currency={currency} />
          </div>
        </div>
        <div className="bg-background border border-border px-4 py-3">
          <div className="text-[12px] text-[#606060] mb-2">Currency</div>
          <div className="text-[18px] font-medium">{currency}</div>
        </div>
        <div className="bg-background border border-border px-4 py-3">
          <div className="text-[12px] text-[#606060] mb-2">Type</div>
          <div className="text-[18px] font-medium capitalize">
            {account.type ?? "—"}
          </div>
        </div>
        <div className="bg-background border border-border px-4 py-3">
          <div className="text-[12px] text-[#606060] mb-2">Transactions</div>
          <div className="text-[18px] font-medium">{transactions.length}</div>
        </div>
      </div>

      {/* Transactions Table */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[16px] font-medium">Transactions</h2>
          <span className="text-xs text-[#606060]">
            {transactions.length} transactions
          </span>
        </div>

        {transactions.length > 0 ? (
          <div className="bg-background border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-[12px] font-medium text-[#606060]">
                    Date
                  </TableHead>
                  <TableHead className="text-[12px] font-medium text-[#606060]">
                    Description
                  </TableHead>
                  <TableHead className="text-[12px] font-medium text-[#606060] text-center">
                    Type
                  </TableHead>
                  <TableHead className="text-[12px] font-medium text-[#606060] text-center">
                    Status
                  </TableHead>
                  <TableHead className="text-[12px] font-medium text-[#606060] text-right">
                    Amount
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow
                    key={tx.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <TableCell className="text-[13px]">
                      {tx.date
                        ? format(new TZDate(tx.date, "UTC"), "MMM d, yyyy")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-[13px] font-medium truncate max-w-[300px]">
                          {tx.name}
                        </div>
                        {tx.description && (
                          <div className="text-[11px] text-[#606060] truncate max-w-[300px]">
                            {tx.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <TransactionTypeBadge type={tx.transactionType} />
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-[12px] capitalize text-[#606060]">
                        {tx.status ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={cn(
                          "text-[13px] font-mono font-medium",
                          tx.amount > 0 && "text-[#00C969]",
                        )}
                      >
                        <FormatAmount
                          amount={tx.amount}
                          currency={tx.currency}
                        />
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {hasNextPage && (
              <div className="flex justify-center py-4 border-t">
                <button
                  type="button"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="text-sm text-[#606060] hover:text-primary transition-colors"
                >
                  {isFetchingNextPage ? "Loading..." : "Load more"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-background border border-border py-16 text-center">
            <Icons.Transactions className="h-8 w-8 mx-auto text-[#606060] mb-4" />
            <p className="text-[#606060] mb-2">No transactions</p>
            <p className="text-sm text-[#878787]">
              No transactions found for this account.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
