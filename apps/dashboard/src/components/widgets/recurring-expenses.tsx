"use client";

import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { FormatAmount } from "@/components/format-amount";
import { useMetricsFilter } from "@/hooks/use-metrics-filter";
import { useTRPC } from "@/trpc/client";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";
import { WidgetSkeleton } from "./widget-skeleton";

export function RecurringExpensesWidget() {
  const trpc = useTRPC();
  const { from, to, currency } = useMetricsFilter();

  const { data, isLoading } = useQuery({
    ...trpc.widgets.getRecurringExpenses.queryOptions({
      from,
      to,
    }),
    ...WIDGET_POLLING_CONFIG,
  });

  if (isLoading) {
    return (
      <WidgetSkeleton
        title="Recurring Expenses"
        icon={<Icons.Repeat className="size-4" />}
      />
    );
  }

  const recurringData = data?.result;

  const getDescription = () => {
    if (!recurringData || recurringData.summary.totalExpenses === 0) {
      return "No recurring expenses";
    }

    const { totalExpenses } = recurringData.summary;

    if (totalExpenses === 1) {
      return "1 recurring expense";
    }

    return `${totalExpenses} recurring expenses`;
  };

  return (
    <BaseWidget
      title="Recurring Expenses"
      icon={<Icons.Repeat className="size-4" />}
      description={getDescription()}
    >
      {recurringData && recurringData.summary.totalExpenses > 0 && (
        <div className="flex items-baseline w-full">
          <span className="text-2xl font-normal">
            <FormatAmount
              amount={recurringData.summary.totalMonthlyEquivalent}
              currency={currency || "USD"}
            />
          </span>
          <span className="text-xs text-muted-foreground ml-1">/month</span>
        </div>
      )}
    </BaseWidget>
  );
}
