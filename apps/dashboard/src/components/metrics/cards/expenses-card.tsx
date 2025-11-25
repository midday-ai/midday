"use client";

import { AnimatedNumber } from "@/components/animated-number";
import { StackedBarChart } from "@/components/charts/stacked-bar-chart";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";

interface ExpensesCardProps {
  from: string;
  to: string;
  currency?: string;
  locale?: string;
  isCustomizing: boolean;
  wiggleClass?: string;
}

export function ExpensesCard({
  from,
  to,
  currency = "USD",
  locale,
  isCustomizing,
  wiggleClass,
}: ExpensesCardProps) {
  const trpc = useTRPC();

  const { data: expenseData } = useQuery(
    trpc.reports.expense.queryOptions({
      from,
      to,
      currency,
    }),
  );

  const averageExpense = expenseData?.summary?.averageExpense ?? 0;

  return (
    <div className="border bg-background border-border p-6 flex flex-col h-full">
      <div className="mb-4 min-h-[140px]">
        <h3 className="text-sm font-normal mb-1 text-muted-foreground">
          Monthly Expenses
        </h3>
        <p className="text-3xl font-normal mb-3">
          <AnimatedNumber
            value={averageExpense}
            currency={currency}
            locale={locale}
            maximumFractionDigits={0}
          />
        </p>
        <p className="text-xs text-muted-foreground">Average expenses</p>
      </div>
      <div className="h-80">
        {expenseData?.result && expenseData.result.length > 0 ? (
          <StackedBarChart data={expenseData} height={320} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No expense data available
          </div>
        )}
      </div>
    </div>
  );
}
