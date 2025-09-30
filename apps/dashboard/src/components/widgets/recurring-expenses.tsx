"use client";

import { FormatAmount } from "@/components/format-amount";
import { useTRPC } from "@/trpc/client";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { useRouter } from "next/navigation";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";

export function RecurringExpensesWidget() {
  const trpc = useTRPC();
  const router = useRouter();

  // Calculate current month date range
  const now = new Date();
  const from = format(startOfMonth(now), "yyyy-MM-dd");
  const to = format(endOfMonth(now), "yyyy-MM-dd");

  const { data } = useQuery({
    ...trpc.widgets.getRecurringExpenses.queryOptions({
      from,
      to,
    }),
    ...WIDGET_POLLING_CONFIG,
  });

  const recurringData = data?.result;

  const getDescription = () => {
    if (!recurringData || recurringData.summary.totalExpenses === 0) {
      return "No recurring expenses this month";
    }

    const { totalExpenses } = recurringData.summary;

    // Show count for current month
    const monthName = format(now, "MMMM");

    if (totalExpenses === 1) {
      return `1 recurring expense in ${monthName}`;
    }

    return `${totalExpenses} recurring expenses in ${monthName}`;
  };

  const handleViewRecurring = () => {
    router.push(`/transactions?recurring=monthly&start=${from}&end=${to}`);
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
            <FormatAmount
              amount={recurringData.summary.totalMonthlyEquivalent}
              currency={recurringData.summary.currency}
            />
          </span>
          <span className="text-xs text-muted-foreground ml-1">/month</span>
        </div>
      )}
    </BaseWidget>
  );
}
