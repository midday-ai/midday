"use client";

import { FormatAmount } from "@/components/format-amount";
import { useTRPC } from "@/trpc/client";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { useSuspenseQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export function AccountsList() {
  const trpc = useTRPC();

  const { data: accounts } = useSuspenseQuery(
    trpc.bankAccounts.get.queryOptions(),
  );

  if (!accounts || accounts.length === 0) {
    return (
      <div className="flex items-center justify-center border rounded-md py-16">
        <div className="flex flex-col items-center text-center space-y-2">
          <Icons.Accounts size={32} className="text-muted-foreground" />
          <h3 className="font-medium">No accounts</h3>
          <p className="text-sm text-muted-foreground max-w-[280px]">
            Connect a bank account or create a manual account to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {accounts.map((account) => {
        const balance = account.balance ?? 0;
        const currency = account.currency ?? "USD";
        const lastSynced = account.bankConnection?.lastAccessed;

        return (
          <Link
            key={account.id}
            href={`/accounts/${account.id}`}
            className="flex items-center justify-between p-4 border rounded-md hover:bg-muted/30 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              {account.bankConnection?.logoUrl ? (
                <img
                  src={account.bankConnection.logoUrl}
                  alt=""
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Icons.Accounts size={16} />
                </div>
              )}
              <div>
                <p className="text-sm font-medium">
                  {account.name ?? "Unnamed Account"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {account.bankConnection?.name ??
                    (account.manual ? "Manual" : "")}
                  {lastSynced && (
                    <>
                      {" "}
                      &middot; Synced{" "}
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
                  "text-sm font-mono font-medium",
                  balance > 0 && "text-[#00C969]",
                )}
              >
                <FormatAmount amount={balance} currency={currency} />
              </p>
              <p className="text-xs text-muted-foreground">{currency}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
