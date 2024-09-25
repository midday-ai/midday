import { EmptyState } from "@/components/charts/empty-state";
import { Table } from "@/components/tables/transactions";
import { getTeamBankAccounts } from "@midday/supabase/cached-queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { cn } from "@midday/ui/cn";
import { subMonths } from "date-fns";
import Link from "next/link";
import React from "react";

interface ScrollableTransactionsCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  selectedAccountId?: string | null;
}

const ScrollableTransactionsCard: React.FC<
  ScrollableTransactionsCardProps
> = async ({ className, selectedAccountId }) => {
  const accounts = await getTeamBankAccounts();

  const isEmpty = !accounts?.data?.length;

  return (
    <Card
      className={cn(
        "mt-8 min-h-[530px] overflow-y-auto scrollbar-hide",
        className,
      )}
    >
      {isEmpty && <EmptyState />}
      <div className={`${isEmpty ? "blur-[8px] opacity-20 relative" : ""}`}>
        <CardHeader>
          <CardTitle className="text-2xl">Recent Transactions</CardTitle>
          <CardDescription className="text-md">
            View all recent transactions
          </CardDescription>
          <div className="flex space-x-2">
            <Link
              href="?accountId="
              className={cn(
                "px-3 py-2 rounded",
                !selectedAccountId && "bg-primary text-primary-foreground",
              )}
            >
              All Accounts
            </Link>
            {accounts?.data?.map((account) => (
              <Link
                key={account.id}
                href={`?accountId=${account.id}`}
                className={cn(
                  "px-3 py-2 rounded",
                  selectedAccountId === account.id &&
                    "bg-primary text-primary-foreground",
                )}
              >
                {account.name}
              </Link>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-[2%]">
          <Table
            filter={{
              start: subMonths(new Date(), 1).toISOString(),
              end: new Date().toISOString(),
              accountId: selectedAccountId,
            }}
            page={0}
            sort={["date", "desc"]}
            query={null}
          />
        </CardContent>
      </div>
    </Card>
  );
};

export default ScrollableTransactionsCard;
