"use client";

import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { AnimatedNumber } from "@/components/animated-number";
import { StackedBarChart } from "@/components/charts/stacked-bar-chart";
import { useTRPC } from "@/trpc/client";
import { ChartFadeIn } from "../components/chart-loading-overlay";
import { DragIndicator } from "../components/drag-indicator";
import { ShareMetricButton } from "../components/share-metric-button";

interface ExpensesCardProps {
  from: string;
  to: string;
  currency?: string;
  locale?: string;
  isCustomizing?: boolean;
}

export function ExpensesCard({
  from,
  to,
  currency,
  locale,
  isCustomizing,
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
          <div
            className={
              isCustomizing
                ? ""
                : "opacity-0 group-hover:opacity-100 group-has-[*[data-state=open]]:opacity-100 transition-opacity"
            }
          >
            {isCustomizing ? (
              <DragIndicator />
            ) : (
              <ShareMetricButton
                type="expense"
                from={from}
                to={to}
                currency={currency}
              />
            )}
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
          <ChartFadeIn>
            <StackedBarChart data={expenseData} height={320} />
          </ChartFadeIn>
        ) : isPending ? null : (
          <div className="flex items-center justify-center h-full text-xs text-muted-foreground -mt-10">
            No expense data available.
          </div>
        )}
      </div>
    </div>
  );
}
