"use client";

import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { useMemo } from "react";
import {
  CategoryExpenseDonutChart,
  grayShades,
} from "@/components/charts/category-expense-donut-chart";
import { useTRPC } from "@/trpc/client";
import { formatAmount } from "@/utils/format";
import { ChartFadeIn } from "../components/chart-loading-overlay";
import { DragIndicator } from "../components/drag-indicator";
import { ShareMetricButton } from "../components/share-metric-button";

interface CategoryExpensesCardProps {
  from: string;
  to: string;
  currency?: string;
  locale?: string;
  isCustomizing?: boolean;
}

export function CategoryExpensesCard({
  from,
  to,
  currency,
  locale,
  isCustomizing,
}: CategoryExpensesCardProps) {
  const trpc = useTRPC();

  // Get spending data for categories
  const { data: spendingData, isPending } = useQuery(
    trpc.reports.spending.queryOptions({
      from,
      to,
      currency: currency,
    }),
  );

  const categoryDonutChartData = useMemo(() => {
    if (!spendingData || spendingData.length === 0) return [];

    const total = spendingData.reduce(
      (sum, item) => sum + Math.abs(item.amount),
      0,
    );

    return spendingData.slice(0, 5).map((item) => ({
      category: item.name,
      amount: Math.abs(item.amount),
      percentage: total > 0 ? (Math.abs(item.amount) / total) * 100 : 0,
    }));
  }, [spendingData]);

  const totalExpenses = categoryDonutChartData.reduce(
    (sum, item) => sum + item.amount,
    0,
  );

  const dateRangeDisplay = useMemo(() => {
    try {
      const fromDate = parseISO(from);
      const toDate = parseISO(to);
      return `${format(fromDate, "MMM d")} - ${format(toDate, "MMM d, yyyy")}`;
    } catch {
      return "";
    }
  }, [from, to]);

  return (
    <div className="border bg-background border-border p-6 flex flex-col h-full relative group">
      <div className="mb-4 min-h-[140px]">
        <div className="flex items-start justify-between h-7">
          <h3 className="text-sm font-normal text-muted-foreground">
            Expenses by Category
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
                type="category_expenses"
                from={from}
                to={to}
                currency={currency}
              />
            )}
          </div>
        </div>
        <p className="text-3xl font-normal">
          {formatAmount({
            amount: totalExpenses,
            currency: currency || "USD",
            locale,
            maximumFractionDigits: 0,
          })}
        </p>
        <p className="text-xs mt-1 text-muted-foreground">{dateRangeDisplay}</p>
        {categoryDonutChartData.length > 0 && (
          <div className="flex gap-4 items-center mt-2 flex-wrap">
            {categoryDonutChartData.slice(0, 3).map((item, idx) => (
              <div key={item.category} className="flex gap-2 items-center">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: grayShades[idx % grayShades.length],
                  }}
                />
                <span className="text-xs text-muted-foreground">
                  {item.category}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="h-80">
        {categoryDonutChartData.length > 0 ? (
          <ChartFadeIn>
            <CategoryExpenseDonutChart
              data={categoryDonutChartData}
              height={320}
              currency={currency}
              locale={locale}
            />
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
