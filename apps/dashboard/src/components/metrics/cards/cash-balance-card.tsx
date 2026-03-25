"use client";

import { useQuery } from "@tanstack/react-query";
import { AnimatedNumber } from "@/components/animated-number";
import { BankLogo } from "@/components/bank-logo";
import { useTRPC } from "@/trpc/client";
import { ChartLoadingOverlay } from "../components/chart-loading-overlay";

interface CashBalanceCardProps {
  currency?: string;
  locale?: string;
}

export function CashBalanceCard({ currency, locale }: CashBalanceCardProps) {
  const trpc = useTRPC();

  const { data, isPending } = useQuery(
    trpc.reports.getAccountBalances.queryOptions({ currency }),
  );

  const totalBalance = data?.result?.totalBalance ?? 0;
  const baseCurrency = data?.result?.currency ?? currency ?? "USD";
  const breakdown = data?.result?.accountBreakdown ?? [];

  return (
    <div className="border bg-background border-border p-6 flex flex-col h-full relative group">
      <div className="mb-4 min-h-[140px]">
        <h3 className="text-sm font-normal text-muted-foreground">
          Cash Balance
        </h3>
        <p className="text-3xl font-normal">
          <AnimatedNumber
            value={totalBalance}
            currency={baseCurrency}
            locale={locale}
            maximumFractionDigits={0}
          />
        </p>
      </div>

      <div className="h-80 flex flex-col">
        {isPending && !data ? (
          <div className="flex-1 flex items-center justify-center">
            <ChartLoadingOverlay />
          </div>
        ) : breakdown.length > 0 ? (
          <div className="flex flex-col gap-3 mt-auto">
            {breakdown.map((account) => (
              <div key={account.id} className="flex items-center gap-3 text-sm">
                <BankLogo
                  src={account.logoUrl ?? null}
                  alt={account.name}
                  size={22}
                />
                <span className="text-muted-foreground truncate flex-1">
                  {account.name}
                </span>
                <span className="tabular-nums shrink-0">
                  <AnimatedNumber
                    value={account.convertedBalance}
                    currency={baseCurrency}
                    locale={locale}
                    maximumFractionDigits={0}
                  />
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex items-end text-sm text-muted-foreground">
            No accounts connected
          </div>
        )}
      </div>
    </div>
  );
}
