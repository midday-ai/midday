"use client";

import { useTRPC } from "@/trpc/client";
import { formatAmount } from "@/utils/format";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";

export function RecurringExpensesWidget() {
  const trpc = useTRPC();
  const router = useRouter();

  const { data } = useQuery({
    ...trpc.widgets.getRecurringExpenses.queryOptions({}),
    ...WIDGET_POLLING_CONFIG,
  });

  const recurringData = data?.result;

  const getDescription = () => {
    if (!recurringData || recurringData.summary.totalExpenses === 0) {
      return "No recurring expenses tracked";
    }

    const { totalExpenses, byFrequency } = recurringData.summary;

    // Find the frequency with the most expenses
    const frequencies = [
      { type: "monthly", count: byFrequency.monthly, label: "monthly" },
      { type: "annually", count: byFrequency.annually, label: "annual" },
      { type: "weekly", count: byFrequency.weekly, label: "weekly" },
    ];

    const topFrequency = frequencies.find((f) => f.count > 0);

    if (topFrequency && totalExpenses === 1) {
      return `1 ${topFrequency.label} recurring expense`;
    }

    if (topFrequency) {
      return `${totalExpenses} recurring expenses tracked`;
    }

    return "Track your recurring costs";
  };

  const handleViewRecurring = () => {
    router.push("/transactions?recurring=monthly");
  };

  return (
    <BaseWidget
      title="Recurring Expenses"
      icon={<Icons.Repeat className="size-4" />}
      description={getDescription()}
      onClick={handleViewRecurring}
      actions="View all recurring"
    >
      {recurringData && recurringData.summary.totalExpenses > 0 && (
        <div className="flex items-baseline w-full">
          <span className="text-3xl">
            {formatAmount({
              amount: recurringData.summary.totalMonthlyEquivalent,
              currency: recurringData.summary.currency,
            })}
          </span>
          <span className="text-xs text-muted-foreground ml-1">/month</span>
        </div>
      )}
    </BaseWidget>
  );
}
