"use client";

import { FormatAmount } from "@/components/format-amount";
import { useTRPC } from "@/trpc/client";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { useRouter } from "next/navigation";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";

export function MonthlySpendingWidget() {
  const trpc = useTRPC();
  const router = useRouter();

  // Calculate current month range
  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);

  const { data } = useQuery({
    ...trpc.widgets.getMonthlySpending.queryOptions({
      from: format(currentMonthStart, "yyyy-MM-dd"),
      to: format(currentMonthEnd, "yyyy-MM-dd"),
    }),
    ...WIDGET_POLLING_CONFIG,
  });

  const spending = data?.result;

  const getDescription = () => {
    if (!spending || spending.totalSpending === 0) {
      return "No expenses recorded this month";
    }

    if (spending.topCategory) {
      const percentage = spending.topCategory.percentage.toFixed(0);
      return `${spending.topCategory.name} makes up ${percentage}% of your spending`;
    }

    return "Track your monthly expenses";
  };

  const handleSeeExpenses = () => {
    router.push("/transactions?type=expense");
  };

  return (
    <BaseWidget
      title="Monthly Spending"
      icon={<Icons.Transactions className="size-4" />}
      description={getDescription()}
      onClick={handleSeeExpenses}
      actions="See biggest cost"
    >
      {spending && spending.totalSpending > 0 && (
        <p className="text-3xl">
          <FormatAmount
            amount={spending.totalSpending}
            currency={spending.currency}
          />
        </p>
      )}
    </BaseWidget>
  );
}
