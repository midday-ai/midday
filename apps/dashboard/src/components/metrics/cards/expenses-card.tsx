"use client";

import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { AnimatedNumber } from "@/components/animated-number";
import { StackedBarChart } from "@/components/charts/stacked-bar-chart";
import { useTRPC } from "@/trpc/client";
import { ChartLoadingOverlay } from "../components/chart-loading-overlay";
import { ShareMetricButton } from "../components/share-metric-button";

interface ExpensesCardProps {
  from: string;
  to: string;
  currency?: string;
  locale?: string;
}

export function ExpensesCard({
  from,
  to,
  currency,
  locale,
}: ExpensesCardProps) {
  const trpc = useTRPC();

  const { data: expenseData, isPending } = useQuery(
    trpc.reports.expense.queryOptions({
      from,
      to,
      currency: currency,
    }),
  );

  const averageExpense = expenseData?.summary?.averageExpense ?? 0;
  const hasExpenseData = (expenseData?.result?.length ?? 0) > 0;

  return (
    <div className="border bg-background border-border p-6 flex flex-col h-full relative group">
      <div className="mb-4 min-h-[140px]">
        <div className="flex items-start justify-between h-7">
          <h3 className="text-sm font-normal text-muted-foreground">
            Average Monthly Expenses
          </h3>
          <div className="opacity-0 group-hover:opacity-100 group-has-[*[data-state=open]]:opacity-100 transition-opacity">
            <ShareMetricButton
              type="expense"
              from={from}
              to={to}
              currency={currency}
            />
          </div>
        </div>
        <p className="text-3xl font-normal mb-3">
          <AnimatedNumber
            value={averageExpense}
            currency={currency || "USD"}
            locale={locale}
            maximumFractionDigits={0}
          />
        </p>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex gap-2 items-center">
            <div className="w-2 h-2 rounded-full bg-[#C6C6C6] dark:bg-[#606060]" />
            <span className="text-xs text-muted-foreground">Total</span>
          </div>
          <div className="flex gap-2 items-center">
            <div className="w-2 h-2 flex items-center justify-center">
              <Icons.DotRaster />
            </div>
            <span className="text-xs text-muted-foreground">Recurring</span>
          </div>
        </div>
      </div>
      <div className="h-80">
        {hasExpenseData ? (
          <StackedBarChart data={expenseData} height={320} />
        ) : isPending ? (
          <ChartLoadingOverlay />
        ) : (
          <div className="flex items-center justify-center h-full text-xs text-muted-foreground -mt-10">
            No expense data available.
          </div>
        )}
      </div>
    </div>
  );
}
