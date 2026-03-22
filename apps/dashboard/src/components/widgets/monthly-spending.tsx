"use client";

import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { FormatAmount } from "@/components/format-amount";
import { useMetricsFilter } from "@/hooks/use-metrics-filter";
import { useTRPC } from "@/trpc/client";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";
import { WidgetSkeleton } from "./widget-skeleton";

export function MonthlySpendingWidget() {
  const trpc = useTRPC();
  const { from, to, currency } = useMetricsFilter();

  const { data, isLoading } = useQuery({
    ...trpc.widgets.getMonthlySpending.queryOptions({
      from,
      to,
    }),
    ...WIDGET_POLLING_CONFIG,
  });

  if (isLoading) {
    return (
      <WidgetSkeleton
        title="Expenses"
        icon={<Icons.Transactions className="size-4" />}
      />
    );
  }

  const spending = data?.result;

  const getDescription = () => {
    if (!spending || spending.totalSpending === 0) {
      return "No expenses recorded for this period";
    }

    if (spending.topCategory) {
      const percentage = spending.topCategory.percentage.toFixed(0);
      return `${spending.topCategory.name} makes up ${percentage}% of your spending`;
    }

    return "Track your expenses";
  };

  return (
    <BaseWidget
      title="Expenses"
      icon={<Icons.Transactions className="size-4" />}
      description={getDescription()}
    >
      {spending && spending.totalSpending > 0 && (
        <h2 className="text-2xl font-normal">
          <FormatAmount
            amount={spending.totalSpending}
            currency={currency || "USD"}
          />
        </h2>
      )}
    </BaseWidget>
  );
}
