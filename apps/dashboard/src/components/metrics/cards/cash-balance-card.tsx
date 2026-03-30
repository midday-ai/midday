"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { AnimatedNumber } from "@/components/animated-number";
import {
  CashBalanceDonutChart,
  grayShades,
} from "@/components/charts/cash-balance-donut-chart";
import { useTRPC } from "@/trpc/client";
import { ChartFadeIn } from "../components/chart-loading-overlay";
import { DragIndicator } from "../components/drag-indicator";

interface CashBalanceCardProps {
  currency?: string;
  locale?: string;
  isCustomizing?: boolean;
}

export function CashBalanceCard({
  currency,
  locale,
  isCustomizing,
}: CashBalanceCardProps) {
  const trpc = useTRPC();

  const { data, isPending } = useQuery(
    trpc.reports.getAccountBalances.queryOptions({ currency }),
  );

  const totalBalance = data?.result?.totalBalance ?? 0;
  const baseCurrency = data?.result?.currency ?? currency ?? "USD";
  const breakdown = data?.result?.accountBreakdown ?? [];

  const donutData = useMemo(() => {
    if (breakdown.length === 0) return [];

    const total = breakdown.reduce(
      (sum, a) => sum + Math.abs(a.convertedBalance),
      0,
    );

    return breakdown
      .filter((a) => a.convertedBalance > 0)
      .sort((a, b) => b.convertedBalance - a.convertedBalance)
      .slice(0, 7)
      .map((account) => ({
        name: account.name,
        amount: account.convertedBalance,
        percentage: total > 0 ? (account.convertedBalance / total) * 100 : 0,
      }));
  }, [breakdown]);

  return (
    <div className="border bg-background border-border p-6 flex flex-col h-full relative group">
      <div className="mb-4 min-h-[140px]">
        <div className="flex items-start justify-between h-7">
          <h3 className="text-sm font-normal text-muted-foreground">
            Cash Balance
          </h3>
          {isCustomizing && (
            <div>
              <DragIndicator />
            </div>
          )}
        </div>
        <p className="text-3xl font-normal">
          <AnimatedNumber
            value={totalBalance}
            currency={baseCurrency}
            locale={locale}
            maximumFractionDigits={0}
          />
        </p>
        {donutData.length > 0 && (
          <div className="flex gap-4 items-center mt-2 flex-wrap">
            {donutData.slice(0, 3).map((item, idx) => (
              <div key={item.name} className="flex gap-2 items-center">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: grayShades[idx % grayShades.length],
                  }}
                />
                <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="h-80">
        {donutData.length > 0 ? (
          <ChartFadeIn>
            <CashBalanceDonutChart
              data={donutData}
              height={320}
              currency={baseCurrency}
              locale={locale}
            />
          </ChartFadeIn>
        ) : isPending ? null : (
          <div className="flex items-center justify-center h-full text-xs text-muted-foreground -mt-10">
            No accounts connected
          </div>
        )}
      </div>
    </div>
  );
}
